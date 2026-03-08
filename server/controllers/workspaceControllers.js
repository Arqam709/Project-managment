import prisma from "../configs/prisma.js";
import { getAuth } from "@clerk/express";

// Get all workspaces for user
export const getUserWorkspaces = async (req, res) => {

console.log("AUTH HEADER:", req.headers.authorization);
console.log("REQ ORIGIN:", req.headers.origin);
const auth = getAuth(req);
console.log("GETAUTH:", auth);

   try {
    console.log("AUTH HEADER:", req.headers.authorization);
    const { userId } = getAuth(req); // ✅ ADD HERE
    console.log("userId:", userId);  // ✅ ADD HERE

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        members: { include: { user: true } },
        projects: {
          include: {
            tasks: {
              include: {
                assignee: true,
                comments: { include: { user: true } },
              },
            },
            members: { include: { user: true } },
          },
        },
        owner: true,
      },
    });

    return res.json({ workspaces });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.code || error.message });
  }
};

// Add member to workspace
export const addMember = async (req, res) => {
  try {
    const { userId } = getAuth(req); // ✅ correct
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { email, role, workspaceId, message } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "user not found" });

    if (!workspaceId || !role) {
      return res.status(400).json({ message: "missing required parameters" });
    }

    if (!["ADMIN", "MEMBER"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      return res.status(404).json({ message: "workspace not found" });
    }

    const isAdmin = workspace.members.find(
      (member) => member.userId === userId && member.role === "ADMIN"
    );

    if (!isAdmin) {
      return res.status(401).json({ message: "you dont have admin privileges" });
    }

    const existingMember = workspace.members.find(
      (member) => member.userId === user.id
    );

    if (existingMember) {
      return res.status(400).json({ message: "user is already a member" });
    }

    const member = await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId,
        role,
        message,
      },
    });

    return res.json({ member, message: "member added successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.code || error.message });
  }
};