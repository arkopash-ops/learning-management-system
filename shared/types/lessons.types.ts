import { Document, Types } from "mongoose";
import { ResourcesTypes } from "../enum/ResourceTypes.enum";

export interface IResources {
    type: ResourcesTypes;
    label: string;
    url: string;
};

export interface ILesson {
    courseId: Types.ObjectId;
    moduleId: Types.ObjectId;
    title: string;
    description: string;
    order: number;
    videoUrl: string;
    videoDurationSec: number;
    readingContent: string;
    resources: IResources;
    isPreview: boolean;
};

export interface LessonDocument extends ILesson, Document { };
