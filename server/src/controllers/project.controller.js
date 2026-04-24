import prisma from "../lib/prisma.js";

// Get all projects for an org
export const getProjects = async (req, res) => {
  try {
    const { orgId, role, id: userId } = req.user;
    
    let whereClause = { orgId };
    
    if (role !== "ADMIN") {
      whereClause = {
        orgId,
        OR: [
          { visibility: "PUBLIC" },
          { members: { some: { userId } } }
        ]
      };
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: { 
        client: true,
        members: {
          include: {
            user: { select: { id: true, name: true, profilePhoto: true, role: true } }
          }
        }
      }
    });
    res.json({ success: true, data: projects });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch projects." });
  }
};

// Get a single project
export const getProjectById = async (req, res) => {
  try {
    const { orgId, role, id: userId } = req.user;
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id, orgId },
      include: {
        client: true,
        members: {
          include: {
            user: { select: { id: true, name: true, profilePhoto: true, role: true } }
          }
        }
      }
    });

    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    if (role !== "ADMIN" && project.visibility === "PRIVATE") {
      const isMember = project.members.some(m => m.userId === userId);
      if (!isMember) {
        return res.status(403).json({ success: false, message: "Forbidden. Private project." });
      }
    }

    res.json({ success: true, data: project });
  } catch (error) {
    console.error("Get project by id error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch project." });
  }
};

// Create a project
export const createProject = async (req, res) => {
  try {
    const { orgId, id: userId } = req.user;
    const { name, description, clientId, visibility } = req.body;
    
    const newProject = await prisma.project.create({
      data: {
        orgId,
        name,
        description,
        clientId: clientId || null,
        visibility: visibility || "PRIVATE",
        members: {
          create: {
            userId,
            role: "OWNER"
          }
        }
      },
      include: { 
        client: true,
        members: {
          include: {
            user: { select: { id: true, name: true, profilePhoto: true, role: true } }
          }
        }
      }
    });

    res.status(201).json({ success: true, data: newProject, message: "Project created successfully." });
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({ success: false, message: "Failed to create project." });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { orgId, role, id: currentUserId } = req.user;
    const { id } = req.params;
    const { name, description, clientId } = req.body;

    if (role !== "ADMIN") {
      const member = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: id, userId: currentUserId } }
      });
      if (!member || (member.role !== "OWNER" && member.role !== "EDITOR")) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
    }

    const updatedProject = await prisma.project.update({
      where: { id, orgId },
      data: {
        name,
        description,
        clientId: clientId || null,
      },
      include: { 
        client: true, 
        members: { 
          include: { 
            user: { select: { id: true, name: true, profilePhoto: true, role: true } } 
          } 
        } 
      }
    });

    res.json({ success: true, data: updatedProject, message: "Project updated successfully." });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({ success: false, message: "Failed to update project." });
  }
};

// Members Management
export const addProjectMember = async (req, res) => {
  try {
    const { orgId, role, id: currentUserId } = req.user;
    const { id } = req.params;
    const { userId, role: memberRole } = req.body;

    const project = await prisma.project.findUnique({ where: { id }, include: { members: true }});
    if (!project) return res.status(404).json({ success: false, message: "Not found" });

    if (role !== "ADMIN") {
      const member = project.members.find(m => m.userId === currentUserId);
      if (!member || member.role !== "OWNER") {
        return res.status(403).json({ success: false, message: "Forbidden. Only OWNER or ADMIN can add members." });
      }
    }

    const newMember = await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: id, userId } },
      update: { role: memberRole || "VIEWER" },
      create: { projectId: id, userId, role: memberRole || "VIEWER" }
    });

    res.json({ success: true, data: newMember, message: "Member added/updated successfully." });
  } catch (error) {
    console.error("Add member error:", error);
    res.status(500).json({ success: false, message: "Failed to add member." });
  }
};

export const removeProjectMember = async (req, res) => {
  try {
    const { orgId, role, id: currentUserId } = req.user;
    const { id, userId } = req.params;

    const project = await prisma.project.findUnique({ where: { id }, include: { members: true }});
    if (!project) return res.status(404).json({ success: false, message: "Not found" });

    if (role !== "ADMIN") {
      const member = project.members.find(m => m.userId === currentUserId);
      if (!member || member.role !== "OWNER") {
        return res.status(403).json({ success: false, message: "Forbidden. Only OWNER or ADMIN can remove members." });
      }
    }

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId: id, userId } }
    });

    res.json({ success: true, message: "Member removed successfully." });
  } catch (error) {
    console.error("Remove member error:", error);
    res.status(500).json({ success: false, message: "Failed to remove member." });
  }
};

export const updateProjectVisibility = async (req, res) => {
  try {
    const { orgId, role, id: currentUserId } = req.user;
    const { id } = req.params;
    const { visibility } = req.body;

    const project = await prisma.project.findUnique({ where: { id, orgId }, include: { members: true }});
    if (!project) return res.status(404).json({ success: false, message: "Not found" });

    if (role !== "ADMIN") {
      const member = project.members.find(m => m.userId === currentUserId);
      if (!member || member.role !== "OWNER") {
        return res.status(403).json({ success: false, message: "Forbidden. Only OWNER or ADMIN can change visibility." });
      }
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: { visibility }
    });

    res.json({ success: true, data: updatedProject, message: "Visibility updated successfully." });
  } catch (error) {
    console.error("Update visibility error:", error);
    res.status(500).json({ success: false, message: "Failed to update visibility." });
  }
};

// Delete a project
export const deleteProject = async (req, res) => {
  try {
    const { orgId, role, id: currentUserId } = req.user;
    const { id } = req.params;

    if (role !== "ADMIN") {
      const member = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: id, userId: currentUserId } }
      });
      if (!member || member.role !== "OWNER") {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
    }

    await prisma.project.delete({
      where: { id, orgId }
    });
    
    res.json({ success: true, message: "Project deleted successfully." });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ success: false, message: "Failed to delete project." });
  }
};
