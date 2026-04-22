import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import crypto from "crypto";

/**
 * POST /api/employees/invite
 * Mock invite logic for now, generates random user in INACTIVE state
 */
export const inviteEmployee = async (req, res) => {
  try {
    const { email, role, departmentId, managerId } = req.body;
    
    // Check if email exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email is already registered." });
    }

    const tempPassword = crypto.randomBytes(8).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const user = await prisma.user.create({
      data: {
        name: "Pending Invite",
        email,
        password: hashedPassword,
        role: role || "FIELD_EMPLOYEE",
        status: "INACTIVE",
        orgId: req.user.orgId,
        departmentId: departmentId || null,
        managerId: managerId || null,
      },
    });

    // In a real app, send an email to the user with a join link using a signed JWT token
    const mockInviteLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/join?email=${email}&token=mock-token`;

    res.status(201).json({
      success: true,
      message: "Invite sent successfully.",
      data: { inviteLink: mockInviteLink, user },
    });
  } catch (error) {
    console.error("Invite error:", error);
    res.status(500).json({ success: false, message: "Failed to send invite." });
  }
};

/**
 * POST /api/employees
 * Add an employee manually (Active immediately)
 */
export const addEmployee = async (req, res) => {
  try {
    const { name, email, password, role, departmentId, managerId, employeeCode, joiningDate } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required." });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "FIELD_EMPLOYEE",
        status: "ACTIVE",
        orgId: req.user.orgId,
        departmentId: departmentId || null,
        managerId: managerId || null,
        employeeCode: employeeCode || null,
        joiningDate: joiningDate ? new Date(joiningDate) : null,
      },
    });

    res.status(201).json({
      success: true,
      message: "Employee added successfully.",
      data: { user },
    });
  } catch (error) {
    console.error("Add employee error:", error);
    res.status(500).json({ success: false, message: "Failed to add employee." });
  }
};

/**
 * GET /api/employees
 * Filter by role, status, department. Support string searches.
 * Admins see all org employees, Managers see their team.
 */
export const getEmployees = async (req, res) => {
  try {
    const { role, status, departmentId, search } = req.query;

    const query = {
      where: {
        orgId: req.user.orgId,
      },
      include: {
        department: true,
        manager: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    };

    // Role-based visibility logic
    if (req.user.role === "MANAGER") {
      query.where.managerId = req.user.id;
    }

    // Filters
    if (role) query.where.role = role;
    if (status) query.where.status = status;
    if (departmentId) query.where.departmentId = departmentId;
    
    if (search) {
      query.where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employeeCode: { contains: search, mode: "insensitive" } },
      ];
    }

    const employees = await prisma.user.findMany(query);

    res.json({ success: true, data: { employees } });
  } catch (error) {
    console.error("Get employees error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch employees." });
  }
};

/**
 * GET /api/employees/:id
 * Fetch profile details
 */
export const getEmployeeProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate access (manager or admin)
    const query = {
      where: { id, orgId: req.user.orgId },
      include: {
        department: true,
        manager: { select: { id: true, name: true } },
      },
    };

    if (req.user.role === "MANAGER") {
      query.where.managerId = req.user.id;
    }

    const employee = await prisma.user.findFirst(query);

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    res.json({ success: true, data: { employee } });
  } catch (error) {
    console.error("Get employee profile error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch profile." });
  }
};

/**
 * PUT /api/employees/:id
 * Update an employee
 */
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, status, departmentId, managerId, employeeCode } = req.body;

    const query = { where: { id, orgId: req.user.orgId } };
    if (req.user.role === "MANAGER") {
      query.where.managerId = req.user.id;
    }

    const existingEmployee = await prisma.user.findFirst(query);
    if (!existingEmployee) {
      return res.status(404).json({ success: false, message: "Employee not found or access denied." });
    }

    const updatedEmployee = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(role && { role }),
        ...(status && { status }),
        ...(departmentId !== undefined && { departmentId }),
        ...(managerId !== undefined && { managerId }),
        ...(employeeCode !== undefined && { employeeCode }),
      },
      include: { department: true },
    });

    res.json({ success: true, message: "Employee updated.", data: { employee: updatedEmployee } });
  } catch (error) {
    console.error("Update employee error:", error);
    res.status(500).json({ success: false, message: "Failed to update employee." });
  }
};

/**
 * DELETE /api/employees/:id
 * Soft delete (set status to INACTIVE)
 */
export const softDeleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const query = { where: { id, orgId: req.user.orgId } };
    if (req.user.role === "MANAGER") {
      query.where.managerId = req.user.id;
    }

    const existingEmployee = await prisma.user.findFirst(query);
    if (!existingEmployee) {
      return res.status(404).json({ success: false, message: "Employee not found or access denied." });
    }

    await prisma.user.update({
      where: { id },
      data: { status: "INACTIVE" },
    });

    res.json({ success: true, message: "Employee deactivated." });
  } catch (error) {
    console.error("Soft delete error:", error);
    res.status(500).json({ success: false, message: "Failed to deactivate employee." });
  }
};
