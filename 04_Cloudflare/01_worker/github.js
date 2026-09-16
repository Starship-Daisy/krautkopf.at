/--base64url()-base64urlString()-decodePem()--/

function base64url(
  input
) {

  return btoa(
    String.fromCharCode(
      ...new Uint8Array(
        input
      )
    )
  )
    .replace(
      /\+/g,
      "-"
    )
    .replace(
      /\//g,
      "_"
    )
    .replace(
      /=+$/,
      ""
    );

}


function base64urlString(
  input
) {

  return btoa(
    input
  )
    .replace(
      /\+/g,
      "-"
    )
    .replace(
      /\//g,
      "_"
    )
    .replace(
      /=+$/,
      ""
    );

}


function decodePem(
  pem
) {

  const base64 =
    pem
      .replace(
        /-----BEGIN PRIVATE KEY-----/,
        ""
      )
      .replace(
        /-----END PRIVATE KEY-----/,
        ""
      )
      .replace(
        /\s/g,
        ""
      );

  const binary =
    atob(
      base64
    );

  const bytes =
    new Uint8Array(
      binary.length
    );

  for (
    let i = 0;
    i < binary.length;
    i++
  ) {

    bytes[i] =
      binary.charCodeAt(i);

  }

  return bytes;

}

/--------------------/
/--encodeDerLength()--wrapPkcs1InPkcs8()--/

function encodeDerLength(
  length
) {

  if (
    length < 128
  ) {

    return new Uint8Array([
      length
    ]);

  }

  const bytes = [];

  let value =
    length;

  while (
    value > 0
  ) {

    bytes.unshift(
      value & 255
    );

    value >>=
      8;

  }

  return new Uint8Array([
    0x80 |
      bytes.length,
    ...bytes
  ]);

}


function wrapPkcs1InPkcs8(
  pkcs1Bytes
) {

  const version =
    new Uint8Array([
      0x02,
      0x01,
      0x00
    ]);

  const algorithm =
    new Uint8Array([
      0x30,
      0x0d,
      0x06,
      0x09,
      0x2a,
      0x86,
      0x48,
      0x86,
      0xf7,
      0x0d,
      0x01,
      0x01,
      0x01,
      0x05,
      0x00
    ]);

  const octetLength =
    encodeDerLength(
      pkcs1Bytes.length
    );

  const octet =
    new Uint8Array(
      2 +
      octetLength.length +
      pkcs1Bytes.length
    );

  let offset =
    0;

  octet[offset++] =
    0x04;

  octet[offset++] =
    0x00;

  if (
    octetLength.length ===
    1
  ) {

    octet[offset - 1] =
      octetLength[0];

  }
  else {

    octet.set(
      octetLength,
      offset
    );

    offset +=
      octetLength.length;

  }

  octet.set(
    pkcs1Bytes,
    offset
  );

  const sequenceContent =
    new Uint8Array(
      version.length +
      algorithm.length +
      octet.length
    );

  sequenceContent.set(
    version,
    0
  );

  sequenceContent.set(
    algorithm,
    version.length
  );

  sequenceContent.set(
    octet,
    version.length +
    algorithm.length
  );

  const sequenceLength =
    encodeDerLength(
      sequenceContent.length
    );

  const result =
    new Uint8Array(
      1 +
      sequenceLength.length +
      sequenceContent.length
    );

  result[0] =
    0x30;

  result.set(
    sequenceLength,
    1
  );

  result.set(
    sequenceContent,
    1 +
    sequenceLength.length
  );

  return result;

}

/--------------------/
/--createGitHubJWT()--/
/--GitHub-Verbindung testen--/

async function createGitHubJWT(env) {
  const appId = env.GITHUB_APP_ID;
  const privateKey = env.GITHUB_PRIVATE_KEY;

  if (!appId) {
    throw new Error("GITHUB_APP_ID fehlt.");
  }

  if (!privateKey) {
    throw new Error("GITHUB_PRIVATE_KEY fehlt.");
  }

  const header = {
    alg: "RS256",
    typ: "JWT"
  };

  const now =
    Math.floor(Date.now() / 1000);

  const payload = {
    iat: now - 60,
    exp: now + 540,
    iss: appId
  };

  const encodedHeader =
    base64urlString(
      JSON.stringify(header)
    );

  const encodedPayload =
    base64urlString(
      JSON.stringify(payload)
    );

  const unsignedToken =
    encodedHeader +
    "." +
    encodedPayload;

  let keyBytes;

  if (
    privateKey.includes(
      "-----BEGIN RSA PRIVATE KEY-----"
    )
  ) {
    const pkcs1 =
      decodePem(privateKey);

    keyBytes =
      wrapPkcs1InPkcs8(pkcs1);

  } else if (
    privateKey.includes(
      "-----BEGIN PRIVATE KEY-----"
    )
  ) {
    keyBytes =
      decodePem(privateKey);

  } else {
    throw new Error(
      "Unbekanntes Private-Key-Format."
    );
  }

  const cryptoKey =
    await crypto.subtle.importKey(
      "pkcs8",
      keyBytes.buffer,
      {
        name:
          "RSASSA-PKCS1-v1_5",
        hash:
          "SHA-256"
      },
      false,
      ["sign"]
    );

  const signature =
    await crypto.subtle.sign(
      {
        name:
          "RSASSA-PKCS1-v1_5"
      },
      cryptoKey,
      new TextEncoder().encode(
        unsignedToken
      )
    );

  return (
    unsignedToken +
    "." +
    base64url(signature)
  );
}

/-------------------------------/
/--getGitHubInstallationToken()--/

async function getGitHubInstallationToken(env) {
  const jwt =
    await createGitHubJWT(env);

  const response =
    await fetch(
      "https://api.github.com/app/installations/" +
      env.GITHUB_INSTALLATION_ID +
      "/access_tokens",
      {
        method: "POST",
        headers: {
          "Authorization":
            "Bearer " + jwt,

          "Accept":
            "application/vnd.github+json",

          "X-GitHub-Api-Version":
            "2022-11-28",

          "User-Agent":
            "KRAUTKOPF-Redaktion"
        }
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      "GitHub Installation Token Fehler: " +
      JSON.stringify(data)
    );
  }

  return data;
}

async function githubTest(env) {
  const tokenData =
    await getGitHubInstallationToken(env);

  const response =
    await fetch(
      "https://api.github.com/repos/Starship-Daisy/krautkopf.at",
      {
        headers: {
          "Authorization":
            "Bearer " + tokenData.token,

          "Accept":
            "application/vnd.github+json",

          "X-GitHub-Api-Version":
            "2022-11-28",

          "User-Agent":
            "KRAUTKOPF-Redaktion"
        }
      }
    );

  const repository =
    await response.json();

  if (!response.ok) {
    throw new Error(
      "GitHub Repository Fehler: " +
      JSON.stringify(repository)
    );
  }

  return {
    status:
      "ok",

    github: {
      repository:
        repository.full_name,

      private:
        repository.private,

      repository_permissions:
        repository.permissions || {},

      installation_permissions:
        tokenData.permissions || {},

      repository_selection:
        tokenData.repository_selection ||
        null
    }
  };
}


