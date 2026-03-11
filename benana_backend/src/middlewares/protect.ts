import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({ status: "fail", message: "Unauthorized: Log in first" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: number;
    };

    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
    });
    if (!currentUser) {
      return res.status(401).json({
        status: "fail",
        message: "Unauthorized: User no longer exists",
      });
    }

    (req as any).user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({ status: "fail", message: "Invalid token" });
  }
};
