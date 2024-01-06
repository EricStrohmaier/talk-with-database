import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import axios from "axios";
import { IgApiClient } from "instagram-private-api";
import { StickerBuilder } from 'instagram-private-api/dist/sticker-builder';

dotenv.config();

if (!process.env.SUPABASE_URL && !process.env.SUPABASE_KEY) {
    throw new Error('Please provide your Supabase URL and API key on the .env file.');
}
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_KEY as string;
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function getAllTables() {
    try {
        // Fetching all tables using Supabase client
        const { data, error } = await supabase
            .from('information_schema.tables')
            .select('*');
            // .eq('table_schema', 'public'); // Adjust if your tables are in a different schema
    
        if (error) {
            console.error('Error fetching dsfs tables:', error);
            return;
        }
    
        // Displaying table names
        const tableNames = data.map(table => table.table_name);
        console.log('Table Names:', tableNames);
    } catch (error) {
        console.error('Error fetching tables:', error);
    }
}

export async function postToInsta(imageUrl: string, caption: string) {
  const ig = new IgApiClient();
  ig.state.generateDevice(process.env.IG_USERNAME!);
  await ig.account.login(process.env.IG_USERNAME!, process.env.IG_PASSWORD!);

  const { data: imageBuffer } = await axios.get(imageUrl, {
    responseType: "arraybuffer",
  });

  const res = await ig.publish.photo({
    file: Buffer.from(imageBuffer, "binary"),
    caption,
  });
  if (res.status!== "ok") {
    console.log("Something went wrong while publishing the photo", res);
    return { success: false, data: "Something went wrong while publishing the photo" };
  } 
//   console.log('res', res);
  return { success: true, data: JSON.stringify(res) };
}

export async function getInstaLogin(username: string, password: string) {
  const ig = new IgApiClient();

  ig.state.generateDevice(username);
  await ig.account.login(username, password);

  const userData = {
    username: ig.account.currentUser(),
  };
  console.log(JSON.stringify(userData));

  return { success: true, data: JSON.stringify(userData) };
}

export async function postStoryToInsta(imageUrl: string) {
    const ig = new IgApiClient();
    ig.state.generateDevice(process.env.IG_USERNAME!);
    await ig.account.login(process.env.IG_USERNAME!, process.env.IG_PASSWORD!);
  
    const { data: imageBuffer } = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });
      const file = Buffer.from(imageBuffer, "binary");

  const res = await ig.publish.story({
    file,
  });
  if (res.status!== "ok") {
    return { success: false, data: JSON.stringify(res) };
  } 
  return { success: true, data: JSON.stringify(res) };
}

export async function postVideoToInsta(video: any, caption?: string) {
    const ig = new IgApiClient();
    ig.state.generateDevice(process.env.IG_USERNAME!);
    await ig.account.login(process.env.IG_USERNAME!, process.env.IG_PASSWORD!);

    const { data: imageBuffer } = await axios.get(video, {
        responseType: "arraybuffer",
      });
      const file = Buffer.from(imageBuffer, "binary");
      const res = await ig.publish.video({
          video: (file),
          coverImage: (file),
      })

      if (res.status!== "ok") {
        return { success: false, data: JSON.stringify(res) };
      } 
      return { success: true, data: JSON.stringify(res) };
}

export async function getStoryFeed(){

}

export async function getPostFeed(){
  const ig = new IgApiClient();
  ig.state.generateDevice(process.env.IG_USERNAME!);
  // ig.state.proxyUrl = process.env.IG_PROXY;
  const auth = await ig.account.login(process.env.IG_USERNAME!, process.env.IG_PASSWORD!);
  
  const followersFeed = ig.feed.accountFollowing(auth.pk);
  const wholeResponse = await followersFeed.request();
  const users = wholeResponse.users;

  for (const user of users) {
    const targetUser = user;  
    const reelsFeed = ig.feed.reelsMedia({
      userIds: [targetUser.pk],
    });
  
    const storyItems = await reelsFeed.items();
  
    if (storyItems.length === 0) {
      console.log(`${targetUser.username}'s story is empty`);
    } else {
      console.log('storyItems',storyItems);
      const videoDashManifests = storyItems.map(storyItem => storyItem.video_dash_manifest);
      console.log(`${targetUser.username}'s story items:`);
      const res = await parsString(videoDashManifests)      
    }
  }

}

import * as xml2js from 'xml2js';

export async function parsString(manifestData: string[]) {
// const manifestData = `
//       <MPD xmlns="urn:mpeg:dash:schema:mpd:2011" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:mpeg:dash:schema:mpd:2011 DASH-MPD.xsd" profiles="urn:mpeg:dash:profile:isoff-on-demand:2011" minBufferTime="PT2S" type="static" mediaPresentationDuration="PT2.866666555404663S"><Period id="0" duration="PT2.866666555404663S"><AdaptationSet id="0" contentType="video" frameRate="15360/512" subsegmentAlignment="true" par="9:16" FBUnifiedUploadResolutionMos="360:73"><Representation id="900965885032029vd" bandwidth="752165" codecs="avc1.64001f" mimeType="video/mp4" sar="1:1" FBEncodingTag="dash_high_1_v1" FBPlaybackResolutionMos="0:100,360:84.2,480:83.4,720:83.7,1080:85.2" FBPlaybackResolutionMosConfidenceLevel="high" FBPlaybackResolutionCsvqm="0:100,360:94.7,480:94.4,720:94.5,1080:95" width="720" height="1280" FBDefaultQuality="1" FBQualityClass="hd" FBQualityLabel="720p"><BaseURL>https://scontent-vie1-1.cdninstagram.com/v/t72.14836-16/353824137_1080195406658222_6720916309288073500_n.mp4?_nc_cat=107&amp;ccb=1-7&amp;_nc_sid=9a5d50&amp;efg=eyJ2ZW5jb2RlX3RhZyI6ImlnLXhwdmRzLnN0b3J5LmMyLUMzLmRhc2hfaGlnaF8xX3YxIn0%3D&amp;_nc_ohc=3O07i-DLoYkAX_Bky0n&amp;_nc_ht=scontent-vie1-1.cdninstagram.com&amp;oh=00_AfAlzHXj0R8sU0GONhZ-4kYZBQjh3m42ZHauqmvZZFMG9g&amp;oe=659E185A</BaseURL><SegmentBase indexRange="862-905" timescale="15360" FBFirstSegmentRange="906-269525" FBFirstSegmentDuration="2866" FBPrefetchSegmentRange="906-269525" FBPrefetchSegmentDuration="2866"><Initialization range="0-861"/></SegmentBase></Representation><Representation id="374103868635361v" bandwidth="476492" codecs="avc1.64001f" mimeType="video/mp4" sar="1:1" FBEncodingTag="dash_high_2_v1" FBPlaybackResolutionMos="0:100,360:78.1,480:77.7,720:78.8,1080:81.4" FBPlaybackResolutionMosConfidenceLevel="high" FBPlaybackResolutionCsvqm="0:100,360:92.1,480:91.9,720:92.5,1080:93.7" width="616" height="1096" FBQualityClass="sd" FBQualityLabel="640p"><BaseURL>https://scontent-vie1-1.cdninstagram.com/v/t72.14836-16/352224814_411904231165053_5622042387962681627_n.mp4?_nc_cat=104&amp;ccb=1-7&amp;_nc_sid=9a5d50&amp;efg=eyJ2ZW5jb2RlX3RhZyI6ImlnLXhwdmRzLnN0b3J5LmMyLUMzLmRhc2hfaGlnaF8yX3YxIn0%3D&amp;_nc_ohc=GMC1UENctqsAX9a3Gw4&amp;_nc_ht=scontent-vie1-1.cdninstagram.com&amp;oh=00_AfBYevgAe9gxfKpmyRkvFYatnGvCGK4OIE9sIyo-hmxIOA&amp;oe=659F03B7</BaseURL><SegmentBase indexRange="866-909" timescale="15360" FBFirstSegmentRange="910-170742" FBFirstSegmentDuration="2866" FBPrefetchSegmentRange="910-170742" FBPrefetchSegmentDuration="2866"><Initialization range="0-865"/></SegmentBase></Representation><Representation id="2348667285521592v" bandwidth="256398" codecs="avc1.64001f" mimeType="video/mp4" sar="1:1" FBEncodingTag="dash_high_3_v1" FBPlaybackResolutionMos="0:100,360:73.2,480:73,720:74.5,1080:76.9" FBPlaybackResolutionMosConfidenceLevel="high" FBPlaybackResolutionCsvqm="0:100,360:87.8,480:87.6,720:89,1080:91.2" width="420" height="746" FBQualityClass="sd" FBQualityLabel="360p"><BaseURL>https://scontent-vie1-1.cdninstagram.com/v/t72.14836-16/412415458_339569968838579_8089933649570636063_n.mp4?_nc_cat=110&amp;ccb=1-7&amp;_nc_sid=9a5d50&amp;efg=eyJ2ZW5jb2RlX3RhZyI6ImlnLXhwdmRzLnN0b3J5LmMyLUMzLmRhc2hfaGlnaF8zX3YxIn0%3D&amp;_nc_ohc=jG1vxT7i8mEAX-q5vj4&amp;_nc_ht=scontent-vie1-1.cdninstagram.com&amp;oh=00_AfCYp39tQCPfin-TwWH8TSrWvQokz6mc8pzZWDFgfPGB1g&amp;oe=659D783E</BaseURL><SegmentBase indexRange="864-907" timescale="15360" FBFirstSegmentRange="908-91875" FBFirstSegmentDuration="2866" FBPrefetchSegmentRange="908-91875" FBPrefetchSegmentDuration="2866"><Initialization range="0-863"/></SegmentBase></Representation><Representation id="746436717504719v" bandwidth="123745" codecs="avc1.64001f" mimeType="video/mp4" sar="1:1" FBEncodingTag="dash_high_4_v1" FBPlaybackResolutionMos="0:100,360:67.1,480:67.1,720:69.1,1080:72.2" FBPlaybackResolutionMosConfidenceLevel="high" FBPlaybackResolutionCsvqm="0:100,360:82,480:82.1,720:83.9,1080:86.8" width="264" height="470" FBQualityClass="sd" FBQualityLabel="270p"><BaseURL>https://scontent-vie1-1.cdninstagram.com/v/t72.14836-16/352221714_303291858846891_7782934567103951136_n.mp4?_nc_cat=111&amp;ccb=1-7&amp;_nc_sid=9a5d50&amp;efg=eyJ2ZW5jb2RlX3RhZyI6ImlnLXhwdmRzLnN0b3J5LmMyLUMzLmRhc2hfaGlnaF80X3YxIn0%3D&amp;_nc_ohc=n3gIP_RQpE4AX-DNkOl&amp;_nc_ht=scontent-vie1-1.cdninstagram.com&amp;oh=00_AfBHR4Y1QtPxMUacpK0B3EIu1SVMTwqY9cpAAhzBIkDEGg&amp;oe=659E3018</BaseURL><SegmentBase indexRange="865-908" timescale="15360" FBFirstSegmentRange="909-44341" FBFirstSegmentDuration="2866" FBPrefetchSegmentRange="909-44341" FBPrefetchSegmentDuration="2866"><Initialization range="0-864"/></SegmentBase></Representation></AdaptationSet><AdaptationSet id="1" contentType="audio" subsegmentAlignment="true"><Representation id="746741790222207ad" bandwidth="115453" codecs="mp4a.40.5" mimeType="audio/mp4" audioSamplingRate="44100" FBEncodingTag="dash_baseline_audio_v1" FBDefaultQuality="1"><AudioChannelConfiguration schemeIdUri="urn:mpeg:dash:23003:3:audio_channel_configuration:2011" value="2"/><BaseURL>https://scontent-vie1-1.cdninstagram.com/v/t50.12441-16/416595080_987508822810036_4771923095812213239_n.mp4?_nc_cat=110&amp;ccb=1-7&amp;_nc_sid=9a5d50&amp;efg=eyJ2ZW5jb2RlX3RhZyI6ImlnLXhwdmRzLnN0b3J5LmMyLUMzLmRhc2hfYmFzZWxpbmVfYXVkaW9fdjEifQ%3D%3D&amp;_nc_ohc=V4ANQksLuHEAX_Ebwep&amp;_nc_ht=scontent-vie1-1.cdninstagram.com&amp;oh=00_AfAlwwgrBPVJ2WIsrfk0gGQCkXyqYwCrKhD3lfOcUNrpJQ&amp;oe=659EE4BC</BaseURL><SegmentBase indexRange="817-872" timescale="44100" FBFirstSegmentRange="873-30046" FBFirstSegmentDuration="2021" FBSecondSegmentRange="30047-39996" FBPrefetchSegmentRange="873-30046" FBPrefetchSegmentDuration="2021"><Initialization range="0-816"/></SegmentBase></Representation></AdaptationSet></Period></MPD>`;
// // const manifestData = `
//       <MPD xmlns="urn:mpeg:dash:schema:mpd:2011" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:mpeg:dash:schema:mpd:2011 DASH-MPD.xsd" profiles="urn:mpeg:dash:profile:isoff-on-demand:2011" minBufferTime="PT2S" type="static" mediaPresentationDuration="PT33.83333206176758S"><Period id="0" duration="PT33.83333206176758S"><AdaptationSet id="0" contentType="video" frameRate="15360/512" subsegmentAlignment="true" par="9:16" FBUnifiedUploadResolutionMos="360:73.4"><Representation id="2296391690568528vd" bandwidth="1531731" codecs="avc1.64001f" mimeType="video/mp4" sar="1:1" FBEncodingTag="dash_high_1_v1" FBPlaybackResolutionMos="0:100,360:85.3,480:81.1,720:76.4" FBPlaybackResolutionMosConfidenceLevel="high" FBPlaybackResolutionCsvqm="0:100,360:95,480:93.5,720:90.8" width="720" height="1280" FBDefaultQuality="1" FBQualityClass="hd" FBQualityLabel="720p"><BaseURL>https://scontent-vie1-1.cdninstagram.com/v/t72.14836-16/328713647_1413980779190523_2483670115246378907_n.mp4?_nc_cat=108&amp;ccb=1-7&amp;_nc_sid=9a5d50&amp;efg=eyJ2ZW5jb2RlX3RhZyI6ImlnLXhwdmRzLnN0b3J5LmMyLUMzLmRhc2hfaGlnaF8xX3YxIn0%3D&amp;_nc_ohc=yl2XqzXe6_cAX-7lVb0&amp;_nc_ht=scontent-vie1-1.cdninstagram.com&amp;oh=00_AfDFpNsGmcrmnN8_BV3NItof2E4tZeNlWR8HWLDU2VSgpw&amp;oe=659DCB18</BaseURL><SegmentBase indexRange="862-977" timescale="15360" FBFirstSegmentRange="978-970666" FBFirstSegmentDuration="5000" FBSecondSegmentRange="970667-1947736" FBPrefetchSegmentRange="978-970666" FBPrefetchSegmentDuration="5000"><Initialization range="0-861"/></SegmentBase></Representation><Representation id="1557945158303083v" bandwidth="948322" codecs="avc1.64001f" mimeType="video/mp4" sar="1:1" FBEncodingTag="dash_high_2_v1" FBPlaybackResolutionMos="0:100,360:76.3,480:72.3,720:67.5" FBPlaybackResolutionMosConfidenceLevel="high" FBPlaybackResolutionCsvqm="0:100,360:90.7,480:86.9,720:82.3" width="672" height="1194" FBQualityClass="sd" FBQualityLabel="640p"><BaseURL>https://scontent-vie1-1.cdninstagram.com/v/t72.14836-16/350554150_300948169597539_8860399485789092841_n.mp4?_nc_cat=110&amp;ccb=1-7&amp;_nc_sid=9a5d50&amp;efg=eyJ2ZW5jb2RlX3RhZyI6ImlnLXhwdmRzLnN0b3J5LmMyLUMzLmRhc2hfaGlnaF8yX3YxIn0%3D&amp;_nc_ohc=2PiQno1dCAMAX893pLM&amp;_nc_ht=scontent-vie1-1.cdninstagram.com&amp;oh=00_AfDIOfMtlzNmGkLUw_HT-FSoFyiZVN-7yO4iAg8Kb6tSgA&amp;oe=659F4426</BaseURL><SegmentBase indexRange="864-979" timescale="15360" FBFirstSegmentRange="980-619419" FBFirstSegmentDuration="5000" FBSecondSegmentRange="619420-1227900" FBPrefetchSegmentRange="980-619419" FBPrefetchSegmentDuration="5000"><Initialization range="0-863"/></SegmentBase></Representation><Representation id="377380271450353v" bandwidth="605885" codecs="avc1.64001f" mimeType="video/mp4" sar="1:1" FBEncodingTag="dash_high_3_v1" FBPlaybackResolutionMos="0:100,360:69.6,480:64.4,720:59.6" FBPlaybackResolutionMosConfidenceLevel="high" FBPlaybackResolutionCsvqm="0:100,360:84.3,480:79.6,720:74.9" width="488" height="868" FBQualityClass="sd" FBQualityLabel="480p"><BaseURL>https://scontent-vie1-1.cdninstagram.com/v/t72.14836-16/353660905_1358616755015547_3893688649536645182_n.mp4?_nc_cat=106&amp;ccb=1-7&amp;_nc_sid=9a5d50&amp;efg=eyJ2ZW5jb2RlX3RhZyI6ImlnLXhwdmRzLnN0b3J5LmMyLUMzLmRhc2hfaGlnaF8zX3YxIn0%3D&amp;_nc_ohc=ED1VQNsRrWwAX8N4qtg&amp;_nc_ht=scontent-vie1-1.cdninstagram.com&amp;oh=00_AfCxKIk7E7VsrLPuIeeN62sjzEOQYERAs5hwgAcsqk9MSw&amp;oe=659F5ED7</BaseURL><SegmentBase indexRange="864-979" timescale="15360" FBFirstSegmentRange="980-399189" FBFirstSegmentDuration="5000" FBSecondSegmentRange="399190-787240" FBPrefetchSegmentRange="980-399189" FBPrefetchSegmentDuration="5000"><Initialization range="0-863"/></SegmentBase></Representation><Representation id="926616875465630v" bandwidth="354071" codecs="avc1.64001f" mimeType="video/mp4" sar="1:1" FBEncodingTag="dash_high_4_v1" FBPlaybackResolutionMos="0:100,360:58.7,480:53.7,720:49.4" FBPlaybackResolutionMosConfidenceLevel="high" FBPlaybackResolutionCsvqm="0:100,360:74.1,480:68.6,720:64.2" width="350" height="622" FBQualityClass="sd" FBQualityLabel="360p"><BaseURL>https://scontent-vie1-1.cdninstagram.com/v/t72.14836-16/353856805_6891839384270108_5944908747305771005_n.mp4?_nc_cat=103&amp;ccb=1-7&amp;_nc_sid=9a5d50&amp;efg=eyJ2ZW5jb2RlX3RhZyI6ImlnLXhwdmRzLnN0b3J5LmMyLUMzLmRhc2hfaGlnaF80X3YxIn0%3D&amp;_nc_ohc=DtgCuCz2hUcAX9yRJJV&amp;_nc_ht=scontent-vie1-1.cdninstagram.com&amp;oh=00_AfAYicEYKVCRYo-TBc1V1ZPYy5WtdfCIkvzhxWnh6K0ogQ&amp;oe=659DB40E</BaseURL><SegmentBase indexRange="865-980" timescale="15360" FBFirstSegmentRange="981-239409" FBFirstSegmentDuration="5000" FBSecondSegmentRange="239410-465812" FBPrefetchSegmentRange="981-239409" FBPrefetchSegmentDuration="5000"><Initialization range="0-864"/></SegmentBase></Representation><Representation id="669990458679864v" bandwidth="221509" codecs="avc1.64001f" mimeType="video/mp4" sar="1:1" FBEncodingTag="dash_high_5_v1" FBPlaybackResolutionMos="0:100,360:45.7,480:41.3,720:38" FBPlaybackResolutionMosConfidenceLevel="high" FBPlaybackResolutionCsvqm="0:100,360:60.7,480:55.5,720:51.9" width="250" height="444" FBQualityClass="sd" FBQualityLabel="180p"><BaseURL>https://scontent-vie1-1.cdninstagram.com/v/t72.14836-16/339735923_283916850969569_8129945922615127823_n.mp4?_nc_cat=109&amp;ccb=1-7&amp;_nc_sid=9a5d50&amp;efg=eyJ2ZW5jb2RlX3RhZyI6ImlnLXhwdmRzLnN0b3J5LmMyLUMzLmRhc2hfaGlnaF81X3YxIn0%3D&amp;_nc_ohc=FbyjNd8Sk34AX8lSowX&amp;_nc_ht=scontent-vie1-1.cdninstagram.com&amp;oh=00_AfCQMlu9_yT0dZEsBQ7XWwxPAiBFbnHkr-jevfNf3u0wMA&amp;oe=659F1912</BaseURL><SegmentBase indexRange="865-980" timescale="15360" FBFirstSegmentRange="981-150550" FBFirstSegmentDuration="5000" FBSecondSegmentRange="150551-291851" FBPrefetchSegmentRange="981-150550" FBPrefetchSegmentDuration="5000"><Initialization range="0-864"/></SegmentBase></Representation><Representation id="1095180908141741v" bandwidth="271328" codecs="avc1.64001f" mimeType="video/mp4" sar="1:1" FBEncodingTag="dash_high_6_v1" FBPlaybackResolutionMos="0:100,360:50.7,480:45.2,720:41.7" FBPlaybackResolutionMosConfidenceLevel="high" FBPlaybackResolutionCsvqm="0:100,360:65.6,480:60.2,720:56" width="240" height="426" FBQualityClass="sd" FBQualityLabel="240p"><BaseURL>https://scontent-vie1-1.cdninstagram.com/v/t72.14836-16/337007614_878214307424885_1040718844704725462_n.mp4?_nc_cat=111&amp;ccb=1-7&amp;_nc_sid=9a5d50&amp;efg=eyJ2ZW5jb2RlX3RhZyI6ImlnLXhwdmRzLnN0b3J5LmMyLUMzLmRhc2hfaGlnaF82X3YxIn0%3D&amp;_nc_ohc=tUlWXLwXcCsAX8MZ6bz&amp;_nc_ht=scontent-vie1-1.cdninstagram.com&amp;oh=00_AfCNrGDc3TM6VBUB6cUzdKVhI1j61TDXsvE84-Jna1gIRw&amp;oe=659F5B3A</BaseURL><SegmentBase indexRange="862-977" timescale="15360" FBFirstSegmentRange="978-201483" FBFirstSegmentDuration="5000" FBSecondSegmentRange="201484-390123" FBPrefetchSegmentRange="978-201483" FBPrefetchSegmentDuration="5000"><Initialization range="0-861"/></SegmentBase></Representation></AdaptationSet><AdaptationSet id="1" contentType="audio" subsegmentAlignment="true"><Representation id="221112251050172ad" bandwidth="142193" codecs="mp4a.40.5" mimeType="audio/mp4" audioSamplingRate="44100" FBEncodingTag="dash_baseline_audio_v1" FBDefaultQuality="1"><AudioChannelConfiguration schemeIdUri="urn:mpeg:dash:23003:3:audio_channel_configuration:2011" value="2"/><BaseURL>https://scontent-vie1-1.cdninstagram.com/v/t50.12441-16/416570972_1842610919524232_7655822657709347968_n.mp4?_nc_cat=105&amp;ccb=1-7&amp;_nc_sid=9a5d50&amp;efg=eyJ2ZW5jb2RlX3RhZyI6ImlnLXhwdmRzLnN0b3J5LmMyLUMzLmRhc2hfYmFzZWxpbmVfYXVkaW9fdjEifQ%3D%3D&amp;_nc_ohc=jV8kWLWN8SgAX9rhaq1&amp;_nc_ht=scontent-vie1-1.cdninstagram.com&amp;oh=00_AfC1FJpLNCd5C_Agk-mOncfQO7PQ-JYBdBdmir1q54cQKA&amp;oe=659E7078</BaseURL><SegmentBase indexRange="817-1052" timescale="44100" FBFirstSegmentRange="1053-36983" FBFirstSegmentDuration="2021" FBSecondSegmentRange="36984-70317" FBPrefetchSegmentRange="1053-36983" FBPrefetchSegmentDuration="2021"><Initialization range="0-816"/></SegmentBase></Representation></AdaptationSet></Period></MPD>\n`;

xml2js.parseString(manifestData, (err, result) => {
    if (err) {
        console.error('Error parsing XML:', err);
        // return;
    }

    if (
      result &&
      result.MPD &&
      result.MPD.Period &&
      result.MPD.Period[0] &&
      result.MPD.Period[0].AdaptationSet &&
      result.MPD.Period[0].AdaptationSet[0] &&
      result.MPD.Period[0].AdaptationSet[0].Representation
  ) {
      const representations = result.MPD.Period[0].AdaptationSet[0].Representation;

    representations.forEach((representation: any) => {
        const representationId = representation.$.id;
        // const bandwidth = representation.$.bandwidth;
        // const codecs = representation.$.codecs;
        // const mimeType = representation.$.mimeType;
        // const width = representation.$.width;
        // const height = representation.$.height;
        const baseURL = representation.BaseURL[0];

        // console.log(`Representation ID: ${representationId}`);
        // // console.log(`Bandwidth: ${bandwidth}`);
        // // console.log(`Codecs: ${codecs}`);
        // // console.log(`MIME Type: ${mimeType}`);
        // // console.log(`Resolution: ${width}x${height}`);
        // console.log(`Base URL: ${baseURL}`);
        // console.log('\n');
    });
  }
  else {
    console.error('XML structure is not as expected.');
  }
});
}
