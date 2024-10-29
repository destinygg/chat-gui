#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <libavcodec/avcodec.h>
#include <libavformat/avformat.h>
#include <libavutil/imgutils.h>
#include <libavutil/opt.h>

#define SOURCE_DIR "./source/"
#define DEST_DIR "./destination/"

// Macro for architecture-specific code
#if defined(__arm__) || defined(__aarch64__)
    #define ARCHITECTURE "ARM"
    using int32 = int32_t; // 32-bit integer type
    using int64 = int64_t; // 64-bit integer type
#elif defined(__i386__) || defined(__x86_64__)
    #define ARCHITECTURE "Intel"
    using int32 = int32_t; // 32-bit integer type
    using int64 = int64_t; // 64-bit integer type
#else
    #define ARCHITECTURE "Unknown Architecture"
    using int32 = int32_t; // Fallback to a standard 32-bit type
    using int64 = int64_t; // Fallback to a standard 64-bit type
#endif

void move_file(const char *filename) {
    char source_path[256];
    char dest_path[256];

    // Construct the source and destination paths
    snprintf(source_path, sizeof(source_path), "%s%s", SOURCE_DIR, filename);
    snprintf(dest_path, sizeof(dest_path), "%s%s", DEST_DIR, filename);

    // Move the file using rename
    if (rename(source_path, dest_path) == 0) {
        printf("Successfully moved: %s\n", filename);
    } else {
        perror("Error moving file");
    }
}

void encode_decode_av1(const char *input_filename, const char *output_filename) {
    AVCodec *codec;
    AVCodecContext *c = NULL;
    int ret;
    FILE *f;
    AVFrame *frame;
    AVPacket *pkt;
    int i, x, y;

    // Register all formats and codecs
    avcodec_register_all();

    // Find the AV1 encoder
    codec = avcodec_find_encoder(AV_CODEC_ID_AV1);
    if (!codec) {
        fprintf(stderr, "Codec not found\n");
        exit(1);
    }

    c = avcodec_alloc_context3(codec);
    if (!c) {
        fprintf(stderr, "Could not allocate video codec context\n");
        exit(1);
    }

    c->bit_rate = 400000;
    c->width = 640;
    c->height = 480;
    c->time_base = (AVRational){1, 25};
    c->framerate = (AVRational){25, 1};
    c->gop_size = 10;
    c->max_b_frames = 1;
    c->pix_fmt = AV_PIX_FMT_YUV420P;

    if (avcodec_open2(c, codec, NULL) < 0) {
        fprintf(stderr, "Could not open codec\n");
        exit(1);
    }

    f = fopen(output_filename, "wb");
    if (!f) {
        fprintf(stderr, "Could not open %s\n", output_filename);
        exit(1);
    }

    pkt = av_packet_alloc();
    if (!pkt) {
        exit(1);
    }

    frame = av_frame_alloc();
    if (!frame) {
        fprintf(stderr, "Could not allocate video frame\n");
        exit(1);
    }
    frame->format = c->pix_fmt;
    frame->width = c->width;
    frame->height = c->height;

    ret = av_frame_get_buffer(frame, 32);
    if (ret < 0) {
        fprintf(stderr, "Could not allocate the video frame data\n");
        exit(1);
    }

    for (i = 0; i < 25; i++) {
        fflush(stdout);

        ret = av_frame_make_writable(frame);
        if (ret < 0)
            exit(1);

        for (y = 0; y < c->height; y++) {
            for (x = 0; x < c->width; x++) {
                frame->data[0][y * frame->linesize[0] + x] = x + y + i * 3;
            }
        }

        for (y = 0; y < c->height / 2; y++) {
            for (x = 0; x < c->width / 2; x++) {
                frame->data[1][y * frame->linesize[1] + x] = 128 + y + i * 2;
                frame->data[2][y * frame->linesize[2] + x] = 64 + x + i * 5;
            }
        }

        frame->pts = i;

        ret = avcodec_send_frame(c, frame);
        if (ret < 0) {
            fprintf(stderr, "Error sending a frame for encoding\n");
            exit(1);
        }

        while (ret >= 0) {
            ret = avcodec_receive_packet(c, pkt);
            if (ret == AVERROR(EAGAIN) || ret == AVERROR_EOF)
                break;
            else if (ret < 0) {
                fprintf(stderr, "Error during encoding\n");
                exit(1);
            }

            fwrite(pkt->data, 1, pkt->size, f);
            av_packet_unref(pkt);
        }
    }

    fclose(f);
    avcodec_free_context(&c);
    av_frame_free(&frame);
    av_packet_free(&pkt);
}

int main() {
    // Example filenames to move
    const char *filenames[] = {
        "file1.txt",
        "file2.txt",
        "example.doc",
        "report.pdf"
    };
    size_t num_files = sizeof(filenames) / sizeof(filenames[0]);

    // Loop through the files and move them
    for (size_t i = 0; i < num_files; ++i) {
        // Add custom logic here to determine if the file should be moved
        if (strstr(filenames[i], "file") != NULL) { // Example: move files with "file" in the name
            move_file(filenames[i]);
        }
    }

    // Example AV1 encode/decode
    encode_decode_av1("input.yuv", "output.av1");

    return 0;
}
