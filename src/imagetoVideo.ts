// import { Configuration, OpenAIApi } from "openai";
// import { supabase } from "./functions";


// const openai = new OpenAIApi(new Configuration({
//   apiKey: process.env.OPENAI_API_KEY,
// }));

// async function analyzeNewMedia() {
//   // Fetch new media_urls from Supabase
//   const { data: mediaEntries, error } = await supabase
//     .from('insta_bucket')
//     .select('media_url')

//   if (error) {
//     console.error('Failed to fetch media entries:', error);
//     return;
//   }

//   for (const entry of mediaEntries) {
//     try {
//       // Call OpenAI's API the right way..
//       const response = await openai.createImageCompletion({
//         model: "image-to-text-v1",
//         image_url: entry.media_url,
//         prompt: "Tell me what's on this picture and if it's important info or not.",
//       });

//       // Update the entry with the analysis result
//       const updateResponse = await supabase
//         .from('media_analysis')
//         .update({ analysis_result: response.data.choices[0].text })
//         .match({ id: entry.id });

//       if (updateResponse.error) {
//         console.error('Failed to update analysis result:', updateResponse.error);
//       } else {
//         console.log('Analysis result updated successfully for', entry.media_url);
//       }
//     } catch (err) {
//       console.error('Error processing media entry:', err);
//     }
//   }
// }

// // Run the function (you might want to set this up to run periodically or trigger it in some way)
// analyzeNewMedia();
