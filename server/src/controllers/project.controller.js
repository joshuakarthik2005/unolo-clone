import prisma from "../lib/prisma.js";

// Get all projects for an org
export const getProjects = async (req, res) => {
  try {
    const { orgId } = req.user;
    const projects = await prisma.project.findMany({
      where: { orgId },
      include: { client: true }
    });
    res.json({ success: true, data: projects });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch projects." });
  }
};

// Create a project
export const createProject = async (req, res) => {
  try {
    const { orgId } = req.user;
    const { name, description, clientId } = req.body;
    
    const newProject = await prisma.project.create({
      data: {
        orgId,
        name,
        description,
        clientId: clientId || null
      },
      include: { client: true }
    });

    res.status(201).json({ success: true, data: newProject, message: "Project created successfully." });
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({ success: false, message: "Failed to create project." });
  }
};

// Delete a project
export const deleteProject = async (req, res) => {
  try {
    const { orgId } = req.user;
    const { id } = req.params;

    await prisma.project.delete({
      where: { id, orgId }
    });
    
    res.json({ success: true, message: "Project deleted successfully." });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ success: false, message: "Failed to delete project." });
  }
};
