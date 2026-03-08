import express from "express"
import { addComment, gettaskComment } from "../controllers/commentController.js";

const commentRouter = express.Router();


commentRouter.post('/',addComment)

commentRouter.get('/:taskId',gettaskComment)


export default commentRouter;