# Tutorial media

The landing page loads its role tutorial videos from the public [Tutorial media v1 release](https://github.com/FaceID-Proyect-2026/FaceLit/releases/tag/tutorial-media-v1). The MP4 files are release attachments rather than application source files. The application build does not require or bundle local copies of them.

`shared/constants/roleVideoSources.web.ts` maps the three role keys to pinned HTTPS download URLs. The existing web player keeps its autoplay, mute, loop and inline playback settings. The native source map remains empty, preserving the native landing cards without downloading web-only videos.

## Published assets

| Role | Release asset | Size in bytes | SHA-256 |
| --- | --- | ---: | --- |
| Apprentice | [apprentice.mp4](https://github.com/FaceID-Proyect-2026/FaceLit/releases/download/tutorial-media-v1/apprentice.mp4) | 53,670,957 | `6b5bb8a1d27481009ca44c8659382e2009f53e0571ad57f9be2085156fd87f62` |
| Coordinator | [coordinator.mp4](https://github.com/FaceID-Proyect-2026/FaceLit/releases/download/tutorial-media-v1/coordinator.mp4) | 101,579,381 | `c7e41eb3bf0b38bdbf169d2c0b1253417416500b82883749244ce84ed06d4238` |
| Instructor | [instructor.mp4](https://github.com/FaceID-Proyect-2026/FaceLit/releases/download/tutorial-media-v1/instructor.mp4) | 89,375,791 | `4e9f728f34c263bd77a185cbaf8d17a44bf438cbf380833cc9c2489e153c5c02` |

The original files total **244,626,129 bytes**. Their SHA-256 values match the uploaded release assets. Anonymous byte-range requests to all three pinned URLs return HTTP `206 Partial Content`, allowing the player to request segments of each file.

## Validation

- Web export completed successfully with 73 static routes after the local MP4 files were removed.
- The exported output contains no MP4 files and includes all three pinned release URLs.
- All three videos were loaded and played in the exported landing page. Each reached media readiness state 4, advanced its playback time and reported no media error.
- GitHub serves these download URLs as `application/octet-stream`; playback was checked in the browser rather than inferred from the HTTP response alone.

## Updating a tutorial

1. Publish the replacement files under a new media release tag. Keep published tags and assets used by existing app versions available.
2. Verify the uploaded files against their local SHA-256 hashes.
3. Update only the relevant URL in the web source map. Use the permanent tagged URL rather than `releases/latest` or a temporary redirected URL.
4. Check playback in the landing page before removing a local source file.

The release must remain publicly readable. The frontend does not use a GitHub token. GitHub Releases distributes files; it does not transcode videos or provide adaptive video streaming. `/assets/videos/` is ignored to prevent local copies from being added to the source tree again.

This cleanup removes the videos from the current source tree. Existing Git history is preserved, so a full clone may still download older binary objects from historical commits.
