const { Telegraf } = require("telegraf");
const axios = require("axios");
const { capitalize } = require("light-string-utils");

const bot = new Telegraf("6249407082:AAHbgiAhwADcnfPLKA26fDZQsASqyoSGeWw");

const message1 = `Let us serve you better. How do you want to see our products?`;
const url = "https://fakestoreapi.com";
let products = [];
let presentPhotoIndex = 0;
let cartProducts = [];

const by_group = (ctx) => {
  bot.telegram.sendMessage(ctx.chat.id, message1, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "By Category", callback_data: "by_category" },
          { text: "By Product", callback_data: "by_product" },
        ],
      ],
    },
  });
};

bot.start((ctx) => {
  bot.telegram.sendMessage(ctx.chat.id, "Welcome to Rajeev's Shop!", {
    reply_markup: {
      keyboard: [[{ text: "Home" }, { text: "My Cart" }]],
      resize_keyboard: true,
    },
  });
  by_group(ctx);
});

bot.action("by_category", async (ctx) => {
  let { data, status } = await axios.get(`${url}/products/categories`);
  let responseData = data;

  ctx.deleteMessage();

  const inline_categories = responseData.map((d) => {
    return [{ text: capitalize(d), callback_data: `products_by-${d}` }];
  });

  bot.telegram.sendMessage(
    ctx.chat.id,
    "Here are the categories you can shop in",
    {
      reply_markup: {
        inline_keyboard: [
          ...inline_categories,
          [{ text: "GO BACK", callback_data: "back_to_group" }],
        ],
      },
    }
  );
  ctx.answerCbQuery();
});

bot.action(/^products_by-/, async (ctx) => {
  let matched = ctx.match.input.split("-");
  console.log(matched);
  let { data, status } = await axios.get(
    `${url}/products/category/${matched[1]}`
  );
  let responseData = data;

  ctx.deleteMessage();

  products = [...responseData];
  console.log(products);

  displayProduct(ctx);
  ctx.answerCbQuery();
});

const generateProductCaption = (productData) => {
  return `*${productData.title}*
productData.description
Category: ${capitalize(productData.category)}
Price: *$${productData.price}*`;
};

const displayProduct = (ctx) => {
  if (products[presentPhotoIndex]) {
    bot.telegram.sendPhoto(ctx.chat.id, products[presentPhotoIndex].image, {
      caption: generateProductCaption(products[presentPhotoIndex]),
      parse_mode: "markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "<< Prev", callback_data: "prev_product" },
            { text: "Add to Cart", callback_data: "add_to_cart" },
            { text: "Next >>", callback_data: "next_product" },
          ],
          [{ text: "GO BACK", callback_data: "back_to_group" }],
        ],
      },
    });
  } else {
    ctx.reply("Unable!");
  }
};

bot.action("prev_product", (ctx) => {
  ctx.deleteMessage();
  presentPhotoIndex =
    presentPhotoIndex === 0 ? presentPhotoIndex : presentPhotoIndex - 1;
  displayProduct(ctx);
  ctx.answerCbQuery();
});

bot.action("next_product", (ctx) => {
  ctx.deleteMessage();
  presentPhotoIndex =
    presentPhotoIndex === products.length - 1 ? 2 : presentPhotoIndex + 1;
  displayProduct(ctx);
  ctx.answerCbQuery();
});

bot.action("add_to_cart", (ctx) => {
  cartProducts.push(products[presentPhotoIndex]);
  ctx.answerCbQuery();
});

bot.action("by_product", async (ctx) => {
  let { data, status } = await axios.get(`${url}/products?limit=20`);
  let responseData = data;

  ctx.deleteMessage();

  products = [...responseData];

  displayProduct(ctx);
  ctx.answerCbQuery();
});

bot.action("back_to_group", (ctx) => {
  ctx.deleteMessage();
  by_group(ctx);
  ctx.answerCbQuery();
});

bot.hears("Home", (ctx) => {
  by_group(ctx);
});

const generateCartMessage = () => {
  let s = `*Products inside cart*
------------------
`;
  let total = 0;
  cartProducts.forEach((p) => {
    s += `*${p.title}*
Category: ${capitalize(p.category)}
Price: *$${p.price}*
`;

    s += `------------------
`;
    total += p.price;
  });

  s += `*Total: $${total}*`;
  return s;
};

bot.hears("My Cart", (ctx) => {
  bot.telegram.sendMessage(ctx.chat.id, generateCartMessage(), {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Checkout", callback_data: "checkout" }],
        [{ text: "Go to Home", callback_data: "back_to_group" }],
      ],
    },
  });
});

bot.action("checkout", (ctx) => {
  ctx.deleteMessage();
  bot.telegram.sendMessage(ctx.chat.id, "Please click on confirm to checkout", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Confirm", callback_data: "checkout_confirm" }],
        [{ text: "Go to Home", callback_data: "back_to_group" }],
      ],
    },
  });
  ctx.answerCbQuery();
});

bot.command("yappa", (ctx) => {
  ctx.reply("Yamma!");
});

bot.launch();
