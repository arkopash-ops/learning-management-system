export type CommentNode = {
    _id: string;
    threadId: string;
    courseId: string;
    lessonId: string;
    authorId: string;
    authorName?: string;
    authorRole?: string;
    parentCommentId: string | null;
    comment: string;
    createdAt: Date;
    updatedAt: Date;
    replies: CommentNode[];
};
