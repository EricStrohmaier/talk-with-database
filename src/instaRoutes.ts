import axios from "axios";

const URL = 'http://localhost:4000';
// https://linkedin-api-wrapper.onrender.com

export const postInstagramStory = async (mediaUrl: string, username: string, password: string, isVideo: boolean, coverImage?: string) => {
    try {
        const response = await axios.post(`${URL}/api/instagram/post/story`, {
            mediaUrl: mediaUrl,
            username: username,
            password: password,
            isVideo: isVideo,
            coverImage: coverImage && 'https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM=',
        });
        return response.data;
    } catch (error) {
        return error;
    }
};

export const postInstagramPost = async (imageUrl: string, caption: string, username: string, password: string) => {
    try {
        const response = await axios.post(`${URL}/api/instagram/post`, {
            imageUrl: imageUrl,
            caption: caption,
            username: username,
            password: password,
        });
        return response.data;
    } catch (error) {
        return error;
    }
};

export const postInstagramVideo = async (videoUrl: string, username: string, password: string, caption?: string, coverImage?: string) => {
    try {
        const response = await axios.post(`${URL}/api/instagram/post/video`, {
            videoUrl: videoUrl,
            coverImageUrl: coverImage ? coverImage : 'https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM=',
            caption: caption,
            username: username,
            password: password,
        });
        return response.data
    } catch (error) {
        return error;
    }
};



