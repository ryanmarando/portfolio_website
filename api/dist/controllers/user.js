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
export const deleteUser = async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const user = await prisma.user.delete({
            where: { id: id },
        });
        console.log("Successful DELETE of Id:", user.id);
        res.sendStatus(200);
    }
    catch (error) {
        console.log("Unsuccessful DELETE of Id:", id);
        res.status(500).json({
            error: `Unsuccessful DELETE...${error}`,
        });
    }
};
export const editUser = async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const user = await prisma.user.update({
            where: { id: id },
            data: req.body,
        });
        res.status(200).json({ user });
    }
    catch (error) {
        console.log("Unsuccessful PATCH for Id:", id, error);
        res.status(404).json({
            error: `Unsuccessful PATCH... ${error}.`,
        });
    }
};
