import cloudinary from "./cloudinary";

type ResourceType = "image" | "video" | "raw" | "auto";

export const deleteFromCloudinary = async (
    publicId: string,
    resourceType: ResourceType = "auto"
) => {
    return await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
    });
};
