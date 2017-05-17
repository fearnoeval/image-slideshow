# image-slideshow

An image slideshow that runs in the browser using local files

## See it in action

- [https://hacks.fearnoeval.com/image-slideshow/](https://hacks.fearnoeval.com/image-slideshow/)

## How to use

- Press the "Select your images" button and select images
- `F` -> Toggle fullscreen
- `F11` -> Toggle fullscreen
- `Double-click` -> Toggle fullscreen
- `F5` -> Restart

## How to build

1. Install [Leiningen](https://leiningen.org/)
2. Clone the repo
3. Run `lein cljsbuild once` in the project's root directory
4. (optional): Run `resources/style.unprefixed.css` through [Autoprefixer](https://github.com/postcss/autoprefixer)
and save the result as `resources/style.css`
5. Open `resources/index.html` in your web browser of choice

## About

- Written in ClojureScript with core.async
- File reading is not done during transitions or during the blackout between
images to ensure maximum smoothness
- The main loop shows off core.async's ability to turn a pyramid of doom from
callback hell into a flat, unfragmented piece of code
- Written in October 2016

## Why?

- My friends needed an image slideshow for their wedding
- All of the programs we looked at had a mix of shortcomings:
  - No transitions
  - No appropriate transitions
  - Transitions that were too fast, and thus distracting
  - Not cross-platform
  - Hard-wired to the images shown

## Caveats

- Image order is always shuffled
- Does not use EXIF data to correct orientation
  - Consider pre-processing the images
    - Hint: `convert in.jpg -auto-orient out.jpg`
- You get one shot to add the images, or else you have to refresh
  - Consider having all images in a single folder so you can simply "select all"
- I manually run the unprefixed CSS file through [Autoprefixer CSS Online](https://autoprefixer.github.io/)
  - Making lein and/or the JS-build-tool-du-jour work together to run
  Autoprefixer wasn't worth the time and effort to me for this project

## "Maybe one day, but probably never" features

- Use EXIF data to determine and set orientation
- Allow customization (duration, transition duration, background color, etc.)
- Allow adding images incrementally
- Allow ordering images instead of always shuffling
- Automate autoprefixing CSS during build

## License

- © 2016-2017 [Tim Walter](https://www.fearnoeval.com/)
- Licensed under the [Eclipse Public License 1.0](LICENSE.html)
