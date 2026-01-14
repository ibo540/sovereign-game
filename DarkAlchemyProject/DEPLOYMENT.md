# Deployment Guide for "Sovereign"

## 0. Push to GitHub
1.  Run the commands you copied to push your code:
    ```bash
    git remote add origin https://github.com/ibo540/sovereign-game.git
    git branch -M main
    git push -u origin main
    ```

## 1. Deploying the Frontend (The Game UI)
We will use **Vercel** to host the game interface.
1.  Go to [Vercel.com](https://vercel.com) and Sign Up/Login.
2.  Click **"Add New..."** -> **"Project"**.
3.  Select **"Import"** next to your `sovereign-game` repository.
4.  **Configure Project**:
    - **Framework Preset**: Vite
    - **Root Directory**: `./` (default)
    - **Build Command**: `npm run build`
    - **Output Directory**: `dist`
5.  Click **Deploy**.

## 2. The Backend (Your Game Server)
You need to deploy your new server code.
1.  Go to [Render.com](https://render.com).
2.  Click **"New"** -> **"Web Service"**.
3.  Connect your `sovereign-game` repository.
4.  **Configuration**:
    - **Name**: `sovereign-server` (or similar).
    - **Root Directory**: `server` (IMPORTANT: set this to `server`).
    - **Runtime**: Node
    - **Build Command**: `npm install`
    - **Start Command**: `node index.js`
5.  Click **Create Web Service**.
6.  **Copy the URL** provided by Render (e.g., `https://sovereign-server.onrender.com`).

## 3. Connect Frontend to Backend
1.  Go back to your code.
2.  Open `src/services/socket.js`.
3.  Replace the `SERVER_URL` with your **NEW Render URL**.
4.  Commit and Push the change:
    ```bash
    git add .
    git commit -m "Update server URL"
    git push
    ```
5.  Vercel will automatically redeploy with the new connection!
