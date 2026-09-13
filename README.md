🧠 MindMesh

Many Agents. One Intelligence.

Turn a goal into action — across the tools where work already happens.

MindMesh is a multi-agent AI operations assistant that transforms natural-language goals into executable, verified workflows across Slack, Google Calendar, and Notion.

Instead of giving users another chatbot that only suggests what to do, MindMesh plans → delegates → executes → verifies → reports with minimal human intervention.

✨ Why MindMesh?

Modern work is fragmented across multiple applications.

A simple request like:

“Organize our hackathon kickoff for next Friday.”

normally requires manually switching between calendars, task boards, and team communication tools.

MindMesh turns that entire request into one intelligent workflow.

                         ┌─────────────────────┐
                         │      USER GOAL      │
                         │ "Organize kickoff"  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    ORCHESTRATOR     │
                         │ Understand & route  │
                         └──────────┬──────────┘
                                    │
                         ┌──────────┼──────────┐
                         ▼          ▼          ▼
                    ┌─────────┐ ┌─────────┐ ┌─────────┐
                    │ Notion  │ │Calendar │ │  Slack  │
                    │  Agent  │ │  Agent  │ │  Agent  │
                    └────┬────┘ └────┬────┘ └────┬────┘
                         │           │           │
                         └───────────┼───────────┘
                                     ▼
                           ┌──────────────────┐
                           │ VERIFICATION     │
                           │ Check + Retry    │
                           └────────┬─────────┘
                                    ▼
                           ┌──────────────────┐
                           │ VERIFIED RESULT  │
                           └──────────────────┘

🚀 Core Capabilities

🤖 Multi-Agent Orchestration

A central Orchestrator Agent understands the user's goal, creates a plan, and delegates work to specialized agents.

📋 Notion Agent

Creates and updates actionable tasks in a connected Notion workspace.

📅 Calendar Agent

Checks availability and creates real Google Calendar events.

💬 Slack Agent

Communicates workflow updates and notifications directly to the team through Slack.

🔍 Verification Agent

Doesn't blindly trust tool responses.

After an action is executed, MindMesh verifies the result and can retry failed operations.

🧠 Workflow Memory

Maintains lightweight context about the current workflow, completed actions, and execution results.

⚡ Minimal Human Intervention

Users describe what they want, while MindMesh handles the operational steps.

🎯 Example Workflow

User

Organize our hackathon kickoff for next Friday.
Create planning tasks, schedule the kickoff meeting,
and notify the team.

MindMesh

1. Understand

Identifies the required actions and constraints.

2. Plan

Create planning tasks
        ↓
Check calendar availability
        ↓
Schedule kickoff
        ↓
Notify team
        ↓
Verify everything

3. Execute

Agent

Action

Application

📋 Notion Agent

Create planning tasks

Notion

📅 Calendar Agent

Check availability + create event

Google Calendar

💬 Slack Agent

Notify team

Slack

🔍 Verification Agent

Validate outcomes

All integrations

4. Report

✅ 4 Notion tasks created
✅ Kickoff scheduled
✅ Slack notification sent
✅ All actions verified

🏗️ Architecture

                         ┌─────────────────┐
                         │      User       │
                         └────────┬────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │     MindMesh UI          │
                    │  Command Center / Logs   │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │    Orchestrator Agent    │
                    │                          │
                    │ Intent → Plan → Delegate │
                    └────────────┬─────────────┘
                                 │
             ┌───────────────────┼───────────────────┐
             │                   │                   │
             ▼                   ▼                   ▼
      ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
      │ Notion Agent│     │Calendar Agent│    │ Slack Agent │
      └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
             │                   │                   │
             ▼                   ▼                   ▼
          Notion             Google Calendar        Slack
             │                   │                   │
             └───────────────────┼───────────────────┘
                                 ▼
                    ┌──────────────────────────┐
                    │   Verification Agent    │
                    │ Check → Retry → Confirm  │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │   Execution Report       │
                    │  Success / Failure / Log │
                    └──────────────────────────┘

🔄 Execution Lifecycle

Every workflow follows a controlled execution lifecycle:

PENDING
   ↓
PLANNING
   ↓
RUNNING
   ↓
TOOL EXECUTION
   ↓
VERIFICATION
   ↓
┌───────────────┐
│               │
▼               ▼
SUCCESS       RETRYING
                 │
                 ▼
             VERIFICATION

MindMesh is designed to avoid simply displaying “Success” after an API call.

An operation is considered complete only after its result is verified.

🛡️ Reliability by Design

MindMesh treats reliability as a first-class feature.

Verification

Every important external action has a verification step.

Retry & Recovery

Transient failures can trigger controlled retries.

Idempotency

The workflow is designed to reduce accidental duplicate actions.

Structured Results

Tools return structured execution results instead of ambiguous text.

{
  "success": true,
  "action": "create_calendar_event",
  "resourceId": "event_123",
  "verified": true
}

Transparent Activity

Users can see what each agent is doing and what happened.

🔌 Integrations

MindMesh currently focuses on three real-world productivity systems:

Integration

Purpose

🟣 Slack

Team communication & notifications

🔵 Google Calendar

Availability & scheduling

⚫ Notion

Tasks & shared workflow records

The architecture is intentionally modular so additional tools can be added later.

🖥️ Experience

MindMesh is designed around a premium, focused command-center experience.

Command Center

Submit a goal in natural language and launch a workflow.

Live Execution

Watch agents plan, delegate, call tools, and verify results.

Workflow History

Review previous workflows and their outcomes.

Agent View

See the role and current state of each specialized agent.

Integration Health

Check whether Slack, Calendar, and Notion are connected and operational.

Activity Timeline

Understand exactly what happened during execution.

🧰 Tech Stack

The stack can evolve during implementation; the core architecture remains integration-first and agent-driven.

Frontend: React / modern web UI

Backend: Node.js server-side runtime

AI: Gemini

Agent orchestration: Tool/function calling + multi-agent workflow

Integrations: Slack API, Google Calendar API, Notion API

Authentication: OAuth / server-side secrets

Deployment: Google AI Studio / Cloud Run or compatible deployment

Version Control: GitHub

🔐 Security

MindMesh follows a server-side secret architecture.

Sensitive credentials should never be exposed in frontend code.

Browser
   │
   │ User request
   ▼
Server
   │
   ├── Secure secrets
   ├── OAuth credentials
   └── API integrations
          │
          ▼
   External applications

Never commit:

.env
API keys
OAuth access tokens
Refresh tokens
Slack bot tokens
Notion secrets
Webhook URLs

Use environment variables or the platform's secure Secrets mechanism.

📁 Suggested Project Structure

mindmesh/
│
├── src/
│   ├── agents/
│   │   ├── orchestrator/
│   │   ├── planner/
│   │   ├── notion/
│   │   ├── calendar/
│   │   ├── slack/
│   │   └── verification/
│   │
│   ├── tools/
│   │   ├── notion/
│   │   ├── calendar/
│   │   └── slack/
│   │
│   ├── workflows/
│   ├── services/
│   ├── components/
│   └── app/
│
├── server/
│   ├── integrations/
│   ├── auth/
│   └── routes/
│
├── .env.example
├── README.md
└── package.json

⚙️ Environment Configuration

Create your local environment using the variables required by your deployment.

Example:

# Slack
SLACK_BOT_TOKEN=
SLACK_DEFAULT_CHANNEL=
SLACK_WEBHOOK_URL=

# Notion
NOTION_TOKEN=
NOTION_DATABASE_ID=

# Google Calendar
GOOGLE_CALENDAR_ID=primary

Never commit real credentials. Use secure secrets in Google AI Studio or your deployment environment.

🧪 Reliability & Testing

MindMesh should test integrations independently before combining them into a complete workflow.

Integration tests

Slack
 └── Connection → Send → Verify

Notion
 └── Connection → Create → Verify

Calendar
 └── Connection → Create → Verify

End-to-end test

User Goal
   ↓
Planning
   ↓
Notion task creation
   ↓
Calendar event creation
   ↓
Slack notification
   ↓
Verification
   ↓
Final report

🌟 What Makes MindMesh Different?

Most AI assistants stop at:

“Here is what you should do.”

MindMesh aims to go further:

Understand
    ↓
Plan
    ↓
Delegate
    ↓
Act
    ↓
Verify
    ↓
Recover
    ↓
Report

The goal is not another chat interface.

The goal is an AI operations layer that can actually move work forward.


🤝 Contributing

Contributions, ideas, and improvements are welcome.

git clone <repository-url>
cd mindmesh
npm install
npm run dev

Create a branch:

git checkout -b feature/your-feature

Commit your changes:

git add .
git commit -m "feat: add your feature"

Push:

git push origin feature/your-feature

Demo Video:
https://www.loom.com/share/a288c1abe5b9485abea69ed960b316b4


<img width="1912" height="801" alt="image" src="https://github.com/user-attachments/assets/aaa25b61-cb3c-42c8-a151-88acbd1e740a" />

<img width="1917" height="800" alt="image" src="https://github.com/user-attachments/assets/11cdabff-33a0-44ec-91ec-8a3ebe58fa7d" />

<img width="1907" height="797" alt="image" src="https://github.com/user-attachments/assets/68061738-63f6-427d-9d92-02d404e11f2e" />

<img width="1920" height="1020" alt="image" src="https://github.com/user-attachments/assets/9f079e96-4e06-4f13-9f24-152b42a3995d" />

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/453b0b48-d4e1-4e88-88a3-194d84849aa3" />

<img width="1920" height="1020" alt="image" src="https://github.com/user-attachments/assets/5dd56ba5-073d-446d-8906-455f347564be" />



📜 License

Add your preferred open-source license here.
