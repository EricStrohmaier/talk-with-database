import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const POSTS_RESOURCE = '/ugcPosts';

export async function main(accessToken: string): Promise<void> {
    try {
        // Make API request to retrieve member details using userinfo endpoint
        const userinfoEndpoint = 'https://api.linkedin.com/v2/userinfo';
        const meResponse = await axios.get(userinfoEndpoint, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const memberId = meResponse.data.sub;

        /**
         * Calling the /posts API to create a text post on behalf of the authenticated member.
         */
        const postCreateResponse = await axios.post(
            `https://api.linkedin.com/v2${POSTS_RESOURCE}`,
            {
                author: `urn:li:person:${memberId}`,
                lifecycleState: 'PUBLISHED',
                visibility: {
                    'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
                },
                specificContent: {
                    'com.linkedin.ugc.ShareContent': {
                        shareCommentary: {
                            text: 'Sample text post created with /ugcPosts API',
                        },
                        shareMediaCategory: 'NONE',
                    },
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
              }
            }
        );

        // This is the created post URN
        console.log('Post Created:', postCreateResponse.data.id);
    } catch (error) {
        console.error('Error creating post:', error);
        throw error;
    }
}



// Example usage
const accessToken = process.env.OAUTH_TOKEN!;

main(accessToken)
  .then(() => {
    console.log('Completed');
  })
  .catch((error) => {
    console.log(`Error encountered: ${error.message}`);
  });
