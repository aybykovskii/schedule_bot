# Schedule telegram bot

This project is a Telegram bot designed to manage scheduling. It uses a `MongoDB` database to store data and interacts with `Google Calendar` to handle scheduling tasks. The bot operates in a specific time frame (defined by `START_HOUR` and `END_HOUR`) and takes a day off (defined by `DAY_OFF`).

# Prerequisites

To run this project, you need to have the following packages installed:
- Bun
- MongoDB

# Installation

- Clone the repository
- Navigate to the project directory
- Run `npm install` to install the necessary dependencies

# Environment Variables
The project uses the following environment variables:

- `TG_BOT_TOKEN`: The current token for the Telegram bot
- `SERVER_PORT`: The port on which the server runs
- `MONGODB_URL`: The URL of the MongoDB database
- `START_HOUR`: The hour at which the bot starts operating
- `END_HOUR`: The hour at which the bot stops operating
- `GOOGLE_ACCOUNT_EMAIL`: The email of the Google account used for calendar operations
- `GOOGLE_CALENDAR_ID`: The ID of the Google Calendar used for scheduling
- `GOOGLE_SCOPE`: The scope of the Google API
- `DAY_OFF`: The day of the week on which the bot does not operate

# Running the Project
- Set the environment variables in a `.env` file in the root directory
- Put the `keys.json` in `src/server/services` to use the Google Calendar (this file has to contain `GOOGLE_PRIVATE_KEY` field)
- You can run `pm2 start pm2.config.js` if you are using `pm2` or just run `bun run server` and `bun run client` in 2 different terminals