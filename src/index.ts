import express from "express";
import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const defaultWebhook = process.env.polGithubNotifications;
const qaWebhook = process.env.polGithubNotificationsQA;

const allowPrActions = new Set(["opened", "closed"]);

app.post("/github-webhook", async (req, res) => {
    try {
        const event = req.headers["x-github-event"];
        const action = req.body.action;
        const pr = req.body.pull_request;
        const repo = req.body.repository;

        console.log(`➡️ Incoming GitHub event: ${event}, action: ${action}`);

        if (event !== "pull_request" || !pr || repo?.full_name !== "ovotech/rise-pol") {
            return res.status(200).send("Not a PR event for rise-pol");
        }

        if (!allowPrActions.has(action)) {
            return res.status(200).send("Ignored PR action");
        }

        const chatMessage = {
            text: `*GitHub PR Update*

*Action:* ${action}
*Title:* ${pr.title}
*Author:* ${pr.user.login}
*Repo:* ${repo.full_name}
*PR #:* ${pr.number}

[View PR](${pr.html_url})`
        };

        await axios.post(defaultWebhook!, chatMessage);

        const hasQaLabel = pr.labels?.some(
            (label: any) => label.name.toUpperCase() === "QA"
        );

        if (hasQaLabel) {
            await axios.post(qaWebhook!, chatMessage);
            console.log(`✅ PR #${pr.number}: sent to BOTH default + QA channels`);
        } else {
            console.log(`✅ PR #${pr.number}: sent to default channel`);
        }

        res.status(200).send("Forwarded");
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            console.error("Error response:", err.response?.data || err.message);
        } else if (err instanceof Error) {
            console.error("Error:", err.message);
        } else {
            console.error("Unknown error:", err);
        }
        res.status(500).send("Failed to forward");
    }
});

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`🚀 Listening on http://localhost:${PORT}/github-webhook`);
});
