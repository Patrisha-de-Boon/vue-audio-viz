export type AudioFile = File & {
    title: string | undefined,
    artist: string | undefined,
    album: string | undefined,
    duration: number | undefined,
    picture: string | undefined,
    key: string,
}
