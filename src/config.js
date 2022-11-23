import dotenv from "dotenv";
dotenv.config();

const port = process.env.PORT;

const canvasUrl = process.env.CANVAS_URL;

const login = process.env.LOGIN;
const password = process.env.PASSWORD;

export { port, canvasUrl, login, password };
