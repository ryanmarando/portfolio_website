import { prisma } from "../config.js";
export const getUsers = async (req, res) => {
    const users = await prisma.user.findMany();
    res.json(users);
    return;
};
export const createUser = async (req, res) => {
    try {
        const user = await prisma.user.create({
            data: req.body,
        });
        res.status(201).json(user);
        return;
    }
    catch (error) {
        console.log("Unsuccessful POST of User Id");
        res.status(500).json({
            error: `Unsuccessful POST...${error}`,
        });
    }
};
