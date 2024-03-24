# mp4box-apps

Developing a set of utilities that leverages mp4box.js to do awesome media processing stuff on the frontend.

Checkout the following utlities:-
- [mp4box player](#mp4box-player)

## 1. mp4box-player

- Video player with on-the-fly fragmentation support using mp4box.js. Integrate you own video data fetching utility if you don't want to use http range requests Checkout [useCustomBufferFetcher.tsx](./demo-player/src/Player/useCustomBufferFetcher.tsx)

```bash
npm i @knide/mp4box-player
```

For Example usage: Checkout [Player.tsx](./demo-player/src/Player/Player.tsx)

### Development Environment setup

1. (Optional) Copy the test `video/` folder to `lib/server/src/static/` from this [google drive link](https://drive.google.com/drive/folders/1c_BqgGk1Y9GFkxPpvn5mEocEDrcbp4n7?usp=sharing).
2. Run these

    ```bash
    yarn install
    yarn dev # starts demo-player app
    yarn serve # starts the media sever
    yarn dev:player # (Optional) re-build mp4box-player lib by watching for changes
    ```

### Why do streaming using mp4box player?

When streaming video on the web without a direct video URL, Media Source Extensions (MSE) combined with streaming protocols like DASH and HLS are commonly used. However, streaming protocols require pre-processed video streaming data. In cases where preprocessing is not possible, and there's no direct video URL to the raw video resource, then mp4box player can help you out here. It's tailored for scenarios where server-side video processing tasks such as fragmentation and transcoding are impractical or unavailable and you don't have a direct video URL to the video resource.

### What sets mp4box apart from traditional streaming methods?

In case you want to understand why mp4box was the "only-way" in order to achieve streaming without using streaming protocols or a direct video URL, the following explanation can help you understand it:

Video is played by using the HTML `<video/>` element. `<video/>` needs any of these two to start playing a video:

1. A video URL: **(Google Drive uses this)**
	 -  No fragmentation needed and no streaming protocol or MSE needed
	 -  When you have a video URL, the browser will take care of all the fragmentation and http range request video data fetching operations
	 -  In case you don't have a direct video URL, for example consider you have an API which sends you data on making POST requests, mp4box can help you out by allowing you use your own video data fetcher utility with mp4box (By default mp4box player uses HTTP range requests if you have provided it a video URL).

2. A SourceBuffer **(Used by YouTube & Loom)**
	- SourceBuffer can only be generated by MSE
	- MSE needs fragmented video data to generate SourceBuffer
	- MSE can only append "good" fragmented video data into the source buffer. If you feed MSE a random fragmented video data byte range, the SourceBuffer will close/exit
	- That's the major reason why MSE CANNOT do seeking because it doesn't know how to append a "random" fragmented video byte-range, simply because it cannot determine where the fragmented data starts from in the given byte range. So here two solutions come to rescue:-
		1. **Streaming protocols** like DASH/HLS (The following points are mainly written to understand DASH)
			- When using DASH, we have the manifest file that exactly tells everything about the fragmented data
			- DASH just has a sole purpose to provide information about the fragmented video data, which DASH players like shaka-player can use to play the video. **FACT:** DASH/HLS players use MSE internally (along with a manifest file that provides information about the prepared fragmented video data present in the server)
			- To play a video using streaming protocols, we have to prepare the streaming video data first.
			- Shaka-packager is able to prepare the streaming data like so:-
				- it takes the mp4/webm video as input
				- it outputs 1 audio stream and 1 (or more) video streams along with a .mpd manifest file. **IMPORTANT FACT:** the manifest file can not be generated separately. It has to be generated along with the audio/video streams
			- Since mp4box player doesn't need preprocessed data, you can directly give raw video buffers to mp4box player. Mp4box player will take care of the video processing on the Frontend side.
				- for mp4, 3gp, mov formats, mp4box is able to start on-the-fly fragmentation directly.
				- But for other formats, first the video chunks would have to go through transcoding step which converts that video chunk to mp4 and then fragmentation can take place using mp4box
		2. **mp4box**
			- mp4box works with MSE internally. It can manage the SourceBuffers for you.
			- mp4box doesn't need any "fragmented" mp4 video data. It just needs normal mp4 video data to work
			- mp4box can perform on-the-fly fragmentation of the video chunks you provide it
			- when we do seeking in the video, mp4box will exactly fetch the byte range needed and do the fragmentation. Since it itself generates the fragmented video data, we don't have to worry about a manifest file to exactly know which video segments you have to fetch
			- The major drawback is that it sometime needs large chunks of video to start fragmentation. Those chunks could worth upto 30 seconds of the video or even larger. mp4box keeps on requesting more video chunks until it could start doing the fragmentation

  ---------------
  **TL;DR**
- mp4box can allows you to use your own video data fetching utility if you don't have a video URL to put in your `<video/>` element.
- mp4box does video processing on the frontend side on-the-fly. Its useful if you are unable to use "streaming protocols" solution because you are unable prepare video streaming data on you server. (*video streaming data means*:- In case of DASH (using shaka-player): 1 audio stream + 1 or more video streams + a .mpd manifest file is needed, in case of HLS: a lot of segmented files + a .m3u8 manifest file is needed)
	
  > mp4box player is useful when you cannot leverage any of the above three conventional streaming methods. It can use video data coming from you custom promise-based data fetching utility + it does fragmentation on-the-fly + it doesn't need a manifest file.

  >	mp4box player should only be used if you could not afford to use conventional streaming methods as they are more performant and battle-tested

### Note

- mp4box-player is still in development. The functionality works as shown in the demo player but its still not production ready because of the following reasons:
  - Sometimes if the `chunkSize` config is set to a small value (say `<3MB`), then the video fragmentation takes a lot of time. [See this GitHub issue for more details](https://github.com/gpac/mp4box.js/issues/391)
  - Transcoding is very slow. So you will face delays when using any video format apart from .mp4, .3gp & .mov
  - Subtitle processing is not currently scheduled for implementation. However, this feature may be added at a later time.

## Acknowledgements

Special thanks to the contributors of [mp4box.js](https://github.com/gpac/mp4box.js) for their invaluable work on the mp4box library. Their efforts have greatly contributed to the functionality of this project.

