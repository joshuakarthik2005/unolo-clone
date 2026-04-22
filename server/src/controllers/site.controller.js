import prisma from "../lib/prisma.js";

export const getSites = async (req, res) => {
  try {
    const sites = await prisma.site.findMany({
      where: { orgId: req.user.orgId },
    });
    res.json({ success: true, data: sites });
  } catch (error) {
    console.error("Get Sites error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch sites." });
  }
};

export const createSite = async (req, res) => {
  try {
    const { name, lat, lng, radius } = req.body;
    
    // Auto-map 1st site to default employees if none exists to ensure tests work out of box
    const site = await prisma.site.create({
      data: {
        name,
        lat,
        lng,
        radius: radius || 100,
        orgId: req.user.orgId
      }
    });

    res.json({ success: true, data: site, message: "Site created." });
  } catch (error) {
    console.error("Create Site error:", error);
    res.status(500).json({ success: false, message: "Failed to create site." });
  }
};
