import cloudinary from "./cloudinary";

export const uploadToCloudinary = async (
    file: string,
    folder: string
) => {
    return await cloudinary.uploader.upload(file, {
        resource_type: "auto", // supports video, pdf, etc
        folder,
    });
};
