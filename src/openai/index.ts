const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export const generateHTML = async (image_url: string): Promise<string> => {
  const SYSTEM_PROMPT = `
    You are an expert Tailwind developer
    You take screenshots of a reference web page from the user, and then build single page apps 
    using Tailwind, HTML and JS.
    You might also be given a screenshot(The second image) of a web page that you have already built, and asked to
    update it to look more like the reference image(The first image).
    
    - Make sure the app looks exactly like the screenshot.
    - Pay close attention to background color, text color, font size, font family, 
    padding, margin, border, etc. Match the colors and sizes exactly.
    - Use the exact text from the screenshot.
    - Do not add comments in the code such as "<!-- Add other navigation links as needed -->" and "<!-- ... other news items ... -->" in place of writing the full code. WRITE THE FULL CODE.
    - Repeat elements as needed to match the screenshot. For example, if there are 15 items, the code should have 15 items. DO NOT LEAVE comments like "<!-- Repeat for each news item -->" or bad things will happen.
    - For images, use placeholder images from https://placehold.co and include a detailed description of the image in the alt text so that an image generation AI can generate the image later.
    
    In terms of libraries,
    
    - Use this script to include Tailwind: <script src="https://cdn.tailwindcss.com"></script>
    - You can use Google Fonts
    - Font Awesome for icons: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"></link>
    
    Return only the full code in <html></html> tags.
    Do not include markdown "\`\`\`" or "\`\`\`html" at the start or end.
    `;
  const USER_CONTENT = `
    Generate code for a web page that looks exactly like this.
    `;

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPEN_AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: USER_CONTENT,
            },
            {
              type: "image_url",
              image_url: {
                url: image_url,
              },
            },
          ],
        },
      ],
    }),
  });

  console.log(`getScheduleDetailFromMessage response: ${response}`);
  const responseJson = (await response.json()) as {
    choices: { message: { content: string } }[];
  };
  console.log(responseJson);
  const choices = responseJson.choices;
  const choice = choices[0];
  const responseMessage = choice.message.content;
  return responseMessage;
};

export const detectCmsArea = async (image_url: string): Promise<string> => {
  const SYSTEM_PROMPT = `
    You are an expert in CMS. The provided image includes a web design concept that contains a lot of CMS content. From this, you will identify the content types that should be managed as articles in the CMS and extract that content as a JSON Object.
    In general, a CMS has the concept of "content types," and each "content type" has "fields" that are managed according to their type. The types of "fields" include single-line text (text), rich text (rich_text), images (image), and dates (calendar).
    For example, if a CMS content type includes "Body," "Title," and "Thumbnail," then "Body" would be "rich_text," "Title" would be "single-line text," and "Thumbnail" would be "image."
    To avoid duplication, you should consolidate content types that have the same fields into a single content type as much as possible.
    Please return the cropping parameters for the image field as numerical values in the format: x: <starting X>, y: <starting Y>, width: <width>, height: <height>.
    Please assign an appropriate alias to each piece of content. The alias should be a unique identifier for the content and should be a string.
    
    Please ensure that the output is in JSON format according to the "Output Format" specified below. This JSON output should not contain any unnecessary characters other than JSON.

    ### Output Format
    {
        "content_type": [
          {
            "field_name": <field_name>,
            "field_type": <text / rich_text / image / calendar>
          }
        ],
        "contents": [
            {
                "content_title": <content_title>,
                "content_alias": <content_alias>,
                "fields: [
                    {
                        "field_name": <field_name>,
                        "field_type": <text / rich_text / image / calendar>
                        "field_value": <field_value>
                    }
                ]
            }
        ]
      }
    `;
  const USER_CONTENT = `This is the image that contains the CMS area. Please identify the content types that should be managed as articles in the CMS and extract that content as a JSON Object.`;
  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPEN_AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: USER_CONTENT,
            },
            {
              type: "image_url",
              image_url: {
                url: image_url,
              },
            },
          ],
        },
      ],
    }),
  });

  console.log(`detectCmsArea response: ${response}`);
  const responseJson = (await response.json()) as {
    choices: { message: { content: string } }[];
  };
  const choices = responseJson.choices;
  const choice = choices[0];
  const responseMessage = choice.message.content;
  return responseMessage;
};

export const replaceEmbedSyntax = async (
  html: string,
  content_json: object
): Promise<string> => {
  const SYSTEM_PROMPT = `
    You are an expert in the embedded syntax of the Spearly CMS product. You will be given HTML and a CMS content object JSON as input, and your task is to rewrite the HTML according to the embedding syntax rules.
    The CMS content object should follow the "CMS Content Object Format." You will replace the text in the HTML with the corresponding values from the "field_value" field according to the replacement syntax rules.

    ## Embedding Syntax Rules
    The embedding syntax is a JavaScript library that fetches data from the CMS and replaces it in the HTML.
    To specify content, you add the following HTML attributes to the small element that contains the text to be replaced:
    \`\`\`<div cms-item cms-content-type="sample" cms-content="<content_alias>">\`\`\`

    The text to be replaced within the small element should be written as {%= sample_<field_name> %}, allowing the library to fetch data from the CMS and replace it.
    Note that:
     - The <field_name> should be the same as the "field_name" in the CMS content object JSON.
     - This field_name is not contain the "content_alias".
     - This field_name should be lowercase and separated by an underscore.

    For example, if <content_alias> is "test," and you want to replace the title stored in the CMS, you would do it like this:
    \`\`\`
    <div cms-item cms-content-type="sample" cms-content="test">
    <h1>{%= sample_test %}</h1>
    </div>
    \`\`\`

    ## CMS Content Object Format
    \`\`\`
    {
    "contents": [
        {
        "content_title": <content_title>,
        "content_alias": <content_alias>,
        "fields": [
            {
            "field_name": <field_name>,
            "field_value": <field_value>
            }
        ]
        }
    ]
    }
    \`\`\`
    `;
  const USER_CONTENT = `Please provide the HTML string and the content JSON object string, and I'll assist you with rewriting the HTML according to the embedding syntax rules.`;
  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPEN_AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: USER_CONTENT,
            },
            {
              type: "text",
              text: html,
            },
            {
              type: "text",
              text: JSON.stringify(content_json),
            },
          ],
        },
      ],
    }),
  });

  console.log(`replaceEmbedSyntax response: ${response}`);
  const responseJson = (await response.json()) as {
    choices: { message: { content: string } }[];
  };
  console.log(responseJson);
  const choices = responseJson.choices;
  const choice = choices[0];
  const responseMessage = choice.message.content;
  return responseMessage;
};
