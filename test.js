const a = {
  id: "101881449574665907179",
  displayName: "demogreenusys",
  name: { familyName: undefined, givenName: "demogreenusys" },
  emails: [{ value: "demogreenusys@gmail.com", verified: true }],
  photos: [
    {
      value:
        "https://lh3.googleusercontent.com/a/ACg8ocL3Ih0gOD-C0RZQOC63nba3LNw28E7fZP2qeWIfag8k=s96-c",
    },
  ],
  provider: "google",
  _raw:
    "{\n" +
    '  "sub": "101881449574665907179",\n' +
    '  "name": "demogreenusys",\n' +
    '  "given_name": "demogreenusys",\n' +
    '  "picture": "https://lh3.googleusercontent.com/a/ACg8ocL3Ih0gOD-C0RZQOC63nba3LNw28E7fZP2qeWIfag8k\\u003ds96-c",\n' +
    '  "email": "demogreenusys@gmail.com",\n' +
    '  "email_verified": true,\n' +
    '  "locale": "en-GB"\n' +
    "}",
  _json: {
    sub: "101881449574665907179",
    name: "demogreenusys",
    given_name: "demogreenusys",
    picture:
      "https://lh3.googleusercontent.com/a/ACg8ocL3Ih0gOD-C0RZQOC63nba3LNw28E7fZP2qeWIfag8k=s96-c",
    email: "demogreenusys@gmail.com",
    email_verified: true,
    locale: "en-GB",
  },
};

console.log(a._json.name);
