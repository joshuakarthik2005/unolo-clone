import prisma from "../lib/prisma.js";

export const getClients = async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      where: { orgId: req.user.orgId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: clients });
  } catch (error) {
    console.error("Get clients error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch clients." });
  }
};

export const getClientById = async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id }
    });
    if (!client || client.orgId !== req.user.orgId) {
      return res.status(404).json({ success: false, message: "Client not found." });
    }
    res.json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch client." });
  }
};

export const createClient = async (req, res) => {
  try {
    const { name, address, lat, lng, contactPerson, phone } = req.body;
    
    const client = await prisma.client.create({
      data: {
        name,
        address,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        contactPerson,
        phone,
        orgId: req.user.orgId
      }
    });

    res.json({ success: true, data: client, message: "Client created." });
  } catch (error) {
    console.error("Create client error:", error);
    res.status(500).json({ success: false, message: "Failed to create client." });
  }
};

export const updateClient = async (req, res) => {
  try {
    const { name, address, lat, lng, contactPerson, phone } = req.body;
    
    // Ensure org match
    const existing = await prisma.client.findUnique({ where: { id: req.params.id }});
    if (!existing || existing.orgId !== req.user.orgId) {
       return res.status(404).json({ success: false, message: "Not found."});
    }

    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: {
        name,
        address,
        lat: lat ? parseFloat(lat) : undefined,
        lng: lng ? parseFloat(lng) : undefined,
        contactPerson,
        phone
      }
    });

    res.json({ success: true, data: client, message: "Client updated." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update client." });
  }
};

export const deleteClient = async (req, res) => {
  try {
    const existing = await prisma.client.findUnique({ where: { id: req.params.id }});
    if (!existing || existing.orgId !== req.user.orgId) {
       return res.status(404).json({ success: false, message: "Not found."});
    }
    await prisma.client.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Client deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete client." });
  }
};
