import usersDbData from "../data/usersDb.json" with { type: "json" };
export default function authMiddleware(req, res, next) {
    const userId = req.cookies.userId;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    req.rootFolderId = usersDbData.find(u => u.id === userId)?.rootFolderId;
    next();
}   