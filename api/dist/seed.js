import { prisma } from "./config.js";
await prisma.youtubeUrls.create({
    data: {
        name: "main",
        titles: [
            "Home Page",
            "Every Day",
            "Active Day",
            "Wet Bulb Globe Temperature Explainer",
            "3D Set",
        ],
        urls: [
            "https://www.youtube.com/watch?v=PjuCnojcgHc",
            "https://youtu.be/rWCfyEGDWW8",
            "https://youtu.be/i_7gFLWLzYY",
            "https://www.youtube.com/watch?embeds_referring_euri=http%3A%2F%2Flocalhost%3A3000%2F&source_ve_path=MTY0OTksMjg2NjQsMTY0NTAz&v=LAhao2jE1qk&feature=youtu.be",
            "https://www.youtube.com/watch?v=Cq5njUmZkJs",
        ],
    },
});
