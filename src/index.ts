import express from "express";
import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const defaultWebhook = process.env.polGithubNotifications;
const qaWebhook = process.env.polGithubNotificationsQA;

const getWebhookUrlWithThreadKey = (webhookUrl: string | undefined, threadKey: string) => {
    if (!webhookUrl) {
        return "";
    }
    const separator = webhookUrl.includes("?") ? "&" : "?";
    return `${webhookUrl}${separator}threadKey=${threadKey}&messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD`;
};

app.post("/github-webhook", async (req, res) => {
    try {
        const event = req.headers["x-github-event"];
        const action = req.body.action;
        const repo = req.body.repository;
        const pr = req.body.pull_request;

        console.log(`➡️ Incoming GitHub event: ${event}, action: ${action}`);

        if (repo?.full_name !== "ovotech/rise-pol") {
            return res.status(200).send("Not a PR event for rise-pol");
        }

        let chatMessage;
        let threadKey;

        if (event === "pull_request" && (action === "opened" || action === "closed")) {
            const labels = pr.labels?.map((label: any) => label.name).join(", ");
            const assignees = pr.assignees?.map((assignee: any) => assignee.login).join(", ");

            let text = `*GitHub PR Update*

*Action:* ${action}
*Title:* ${pr.title}
*Author:* ${pr.user.login}
*Repo:* ${repo.full_name}
*PR #:* ${pr.number}
*Labels:* ${labels || 'None'}`;

            if (assignees) {
                text += `
*Assignees:* ${assignees}`;
            }

            text += `

[View PR](${pr.html_url})`;

            chatMessage = { text };
            threadKey = `pr-${repo.full_name.replace(/\//g, '-')}-${pr.number}`;

        } else if (event === "pull_request_review" && action === "submitted" && req.body.review.state === "approved") {
            const review = req.body.review;
            const user = review.user.login;
            const text = `${user} approved this PR ✅`;
            chatMessage = { text };
            threadKey = `pr-${repo.full_name.replace(/\//g, '-')}-${pr.number}`;
        } else {
            return res.status(200).send("Ignored event");
        }

        if (chatMessage && threadKey) {
            const defaultWebhookUrl = getWebhookUrlWithThreadKey(defaultWebhook, threadKey);

            if (defaultWebhookUrl) {
                await axios.post(defaultWebhookUrl, chatMessage);
            }

            const hasQaLabel = pr.labels?.some(
                (label: any) => label.name.toUpperCase() === "QA"
            );

            if (hasQaLabel) {
                const qaWebhookUrl = getWebhookUrlWithThreadKey(qaWebhook, threadKey);
                if (qaWebhookUrl) {
                    await axios.post(qaWebhookUrl, chatMessage);
                    console.log(`✅ PR #${pr.number}: sent to BOTH default + QA channels (in thread)`);
                }
            } else {
                console.log(`✅ PR #${pr.number}: sent to default channel (in thread)`);
            }
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
