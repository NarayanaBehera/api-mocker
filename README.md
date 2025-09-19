# api-mocker
sample end-to-end setup for an API mocker. I’ll show you a practical way using Node.js + Express + mock config (JSON file) so you can quickly simulate APIs for testing without needing the real backend.

🔹 Step 1: Create a project
1) **Extract api-mocker.zip file**
   
🔹 Step 2: Enter to api-mocker folder

2) **cd api-mocker**
3) **npm init -y**
4) **npm install express body-parser**

🔹 Create **config.json**
🔹 Create **server.js**

✅ Now you just run: **node server.js**

✅ When you hit:

GET http://localhost:9438/tokenKey → it will read and return responses/token.json

GET http://localhost:9438/details → it will read and return responses/bio.json
