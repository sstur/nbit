// The 73 most common mime types and their corresponding file extension(s)
// Source: https://github.com/mdn/content/blob/8833cdb/files/en-us/web/http/basics_of_http/mime_types/common_types/index.md
const mimeTypeList =
  'audio/aac=aac&application/x-abiword=abw&application/x-freearc=arc&image/avif=avif&video/x-msvideo=avi&application/vnd.amazon.ebook=azw&application/octet-stream=bin&image/bmp=bmp&application/x-bzip=bz&application/x-bzip2=bz2&application/x-cdf=cda&application/x-csh=csh&text/css=css&text/csv=csv&application/msword=doc&application/vnd.openxmlformats-officedocument.wordprocessingml.document=docx&application/vnd.ms-fontobject=eot&application/epub+zip=epub&application/gzip=gz&image/gif=gif&text/html=html,htm&image/vnd.microsoft.icon=ico&text/calendar=ics&application/java-archive=jar&image/jpeg=jpeg,jpg&text/javascript=js&application/json=json&application/ld+json=jsonld&audio/midi+audio/x-midi=midi,mid&text/javascript=mjs&audio/mpeg=mp3&video/mp4=mp4&video/mpeg=mpeg&application/vnd.apple.installer+xml=mpkg&application/vnd.oasis.opendocument.presentation=odp&application/vnd.oasis.opendocument.spreadsheet=ods&application/vnd.oasis.opendocument.text=odt&audio/ogg=oga&video/ogg=ogv&application/ogg=ogx&audio/opus=opus&font/otf=otf&image/png=png&application/pdf=pdf&application/x-httpd-php=php&application/vnd.ms-powerpoint=ppt&application/vnd.openxmlformats-officedocument.presentationml.presentation=pptx&application/vnd.rar=rar&application/rtf=rtf&application/x-sh=sh&image/svg+xml=svg&application/x-shockwave-flash=swf&application/x-tar=tar&image/tiff=tif,tiff&video/mp2t=ts&font/ttf=ttf&text/plain=txt&application/vnd.visio=vsd&audio/wav=wav&audio/webm=weba&video/webm=webm&image/webp=webp&font/woff=woff&font/woff2=woff2&application/xhtml+xml=xhtml&application/vnd.ms-excel=xls&application/vnd.openxmlformats-officedocument.spreadsheetml.sheet=xlsx&application/xml=xml&application/vnd.mozilla.xul+xml=xul&application/zip=zip&video/3gpp=3gp&video/3gpp2=3g2&application/x-7z-compressed=7z';

const mimeToExtensions = new Map(
  mimeTypeList.split('&').map((item) => {
    const [mime = '', exts = ''] = item.split('=');
    return [mime, exts.split(',')];
  }),
);

const extToMime = new Map<string, string>();
for (let [mime, exts] of mimeToExtensions) {
  for (let ext of exts) {
    extToMime.set(ext, mime);
  }
}

export function getMimeTypeFromExt(ext: string) {
  return extToMime.get(ext.toLowerCase());
}

export function getExtForMimeType(mimeType: string) {
  const extensions = mimeToExtensions.get(mimeType.toLowerCase());
  return extensions ? extensions[0] : undefined;
}
