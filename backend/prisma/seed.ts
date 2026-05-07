import {
  PrismaClient,
  PlanStatus,
  ItemType,
  ExpenseCategory,
} from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const passwordHash = bcrypt.hashSync("password123", 10);

const templates = {
  beach: [
    { name: "泳衣", quantity: 2 },
    { name: "沙滩裤", quantity: 1 },
    { name: "遮阳帽", quantity: 1 },
    { name: "太阳镜", quantity: 1 },
    { name: "防晒霜", quantity: 1 },
    { name: "拖鞋", quantity: 1 },
    { name: "浴巾", quantity: 1 },
  ],
  hiking: [
    { name: "登山鞋", quantity: 1 },
    { name: "登山杖", quantity: 2 },
    { name: "冲锋衣", quantity: 1 },
    { name: "速干衣", quantity: 2 },
    { name: "头灯", quantity: 1 },
    { name: "帐篷", quantity: 1 },
    { name: "睡袋", quantity: 1 },
  ],
  business: [
    { name: "西装", quantity: 2 },
    { name: "衬衫", quantity: 3 },
    { name: "领带", quantity: 3 },
    { name: "笔记本电脑", quantity: 1 },
    { name: "文件袋", quantity: 1 },
    { name: "名片夹", quantity: 1 },
  ],
};

const cities = [
  "北京",
  "上海",
  "杭州",
  "成都",
  "三亚",
  "西安",
  "重庆",
  "厦门",
  "丽江",
  "大理",
  "桂林",
  "苏州",
  "南京",
  "青岛",
  "大连",
  "深圳",
];

const userEmails = [
  "zhang@example.com",
  "li@example.com",
  "wang@example.com",
  "zhao@example.com",
  "qian@example.com",
];

async function main() {
  console.log("🌱 开始播种数据...");

  const existingUsers = await prisma.user.findMany({
    where: { email: { in: userEmails } },
  });

  if (existingUsers.length > 0) {
    console.log("⚠️  数据库中已有数据，跳过种子数据插入");
    console.log("👤 已有用户数:", existingUsers.length);
    return;
  }

  const usersData = [
    {
      email: "zhang@example.com",
      password: passwordHash,
      name: "张三",
      avatar:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20male%20avatar%20portrait&image_size=square",
    },
    {
      email: "li@example.com",
      password: passwordHash,
      name: "李四",
      avatar:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20female%20avatar%20portrait&image_size=square",
    },
    {
      email: "wang@example.com",
      password: passwordHash,
      name: "王五",
      avatar:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=casual%20male%20avatar%20portrait&image_size=square",
    },
    {
      email: "zhao@example.com",
      password: passwordHash,
      name: "赵六",
      avatar:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=casual%20female%20avatar%20portrait&image_size=square",
    },
    {
      email: "qian@example.com",
      password: passwordHash,
      name: "钱七",
      avatar:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=young%20adult%20avatar%20portrait&image_size=square",
    },
  ];

  for (const userData of usersData) {
    await prisma.user.create({
      data: userData,
    });
  }

  const users = await prisma.user.findMany({
    orderBy: { id: "asc" },
  });

  console.log("👤 创建了 5 个用户");

  const plansData = [
    {
      title: "三亚五日游",
      destinationCity: "三亚",
      budget: 8000,
      status: PlanStatus.PLANNING,
      isPublic: true,
      startOffset: 15,
      endOffset: 20,
      userId: users[0].id,
      coverImage:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tropical%20beach%20resort%20with%20palm%20trees%20and%20blue%20ocean&image_size=square_hd",
    },
    {
      title: "成都美食之旅",
      destinationCity: "成都",
      budget: 5000,
      status: PlanStatus.IN_PROGRESS,
      isPublic: true,
      startOffset: 0,
      endOffset: 4,
      userId: users[0].id,
      coverImage:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20chinese%20street%20food%20market%20at%20night&image_size=square_hd",
    },
    {
      title: "西安历史文化游",
      destinationCity: "西安",
      budget: 4000,
      status: PlanStatus.COMPLETED,
      isPublic: true,
      startOffset: -30,
      endOffset: -26,
      userId: users[1].id,
      coverImage:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ancient%20chinese%20city%20wall%20with%20historical%20architecture&image_size=square_hd",
    },
    {
      title: "上海迪士尼周末",
      destinationCity: "上海",
      budget: 3000,
      status: PlanStatus.COMPLETED,
      isPublic: false,
      startOffset: -60,
      endOffset: -58,
      userId: users[1].id,
      coverImage:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=disneyland%20castle%20with%20colorful%20fireworks%20at%20night&image_size=square_hd",
    },
    {
      title: "厦门海滨度假",
      destinationCity: "厦门",
      budget: 6000,
      status: PlanStatus.PLANNING,
      isPublic: true,
      startOffset: 7,
      endOffset: 11,
      userId: users[2].id,
      coverImage:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=coastal%20city%20with%20gulangyu%20island%20and%20piano%20museum&image_size=square_hd",
    },
    {
      title: "重庆火锅之旅",
      destinationCity: "重庆",
      budget: 4500,
      status: PlanStatus.CANCELLED,
      isPublic: false,
      startOffset: -10,
      endOffset: -5,
      userId: users[3].id,
      coverImage:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chongqing%20hotpot%20with%20spicy%20broth%20and%20city%20skyline&image_size=square_hd",
    },
    {
      title: "丽江古城休闲",
      destinationCity: "丽江",
      budget: 7000,
      status: PlanStatus.PLANNING,
      isPublic: true,
      startOffset: 20,
      endOffset: 26,
      userId: users[3].id,
      coverImage:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ancient%20lijang%20old%20town%20with%20traditional%20naxi%20architecture&image_size=square_hd",
    },
    {
      title: "桂林山水甲天下",
      destinationCity: "桂林",
      budget: 5500,
      status: PlanStatus.COMPLETED,
      isPublic: true,
      startOffset: -45,
      endOffset: -40,
      userId: users[4].id,
      coverImage:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=guilin%20lijiang%20river%20with%20karst%20mountains%20and%20bamboo%20rafts&image_size=square_hd",
    },
  ];

  const now = new Date();

  for (const planData of plansData) {
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() + planData.startOffset);
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + planData.endOffset);

    const plan = await prisma.plan.create({
      data: {
        title: planData.title,
        destinationCity: planData.destinationCity,
        budget: planData.budget,
        status: planData.status,
        isPublic: planData.isPublic,
        startDate: startDate,
        endDate: endDate,
        userId: planData.userId,
        coverImage: planData.coverImage,
      },
    });

    const daysCount =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

    for (let day = 0; day < daysCount && day < 5; day++) {
      const itineraryDate = new Date(startDate);
      itineraryDate.setDate(itineraryDate.getDate() + day);

      const itinerary = await prisma.itinerary.create({
        data: {
          planId: plan.id,
          dayNumber: day + 1,
          date: itineraryDate,
        },
      });

      const itemTypes = [
        ItemType.ATTRACTION,
        ItemType.RESTAURANT,
        ItemType.HOTEL,
        ItemType.TRANSPORTATION,
      ];
      const itemNames: Record<string, string[]> = {
        [ItemType.ATTRACTION]: [
          "故宫博物院",
          "外滩",
          "西湖",
          "宽窄巷子",
          "兵马俑",
          "鼓浪屿",
          "丽江古城",
          "象鼻山",
        ],
        [ItemType.RESTAURANT]: [
          "海底捞火锅",
          "小龙坎",
          "东来顺",
          "杏花楼",
          "楼外楼",
          "南翔小笼",
          "庆功楼",
          "椿风",
        ],
        [ItemType.HOTEL]: [
          "万豪酒店",
          "希尔顿",
          "洲际酒店",
          "香格里拉",
          "凯悦",
          "喜来登",
          "威斯汀",
          "四季酒店",
        ],
        [ItemType.TRANSPORTATION]: [
          "高铁出发",
          "机场接送",
          "市内地铁",
          "出租车",
          "网约车",
          "共享单车",
          "游船",
          "缆车",
        ],
      };

      const icons: Record<string, string> = {
        [ItemType.ATTRACTION]: "fa-landmark",
        [ItemType.RESTAURANT]: "fa-utensils",
        [ItemType.HOTEL]: "fa-hotel",
        [ItemType.TRANSPORTATION]: "fa-plane",
      };

      const itemsCount = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < itemsCount; i++) {
        const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        const names = itemNames[type];
        const startTime = new Date(itineraryDate);
        startTime.setHours(8 + i * 3, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setHours(endTime.getHours() + 2);

        await prisma.itineraryItem.create({
          data: {
            itineraryId: itinerary.id,
            name: names[Math.floor(Math.random() * names.length)],
            address: `${planData.destinationCity}某街道${Math.floor(Math.random() * 100) + 1}号`,
            startTime: startTime,
            endTime: endTime,
            estimatedCost: Math.floor(Math.random() * 500) + 50,
            type: type,
            icon: icons[type],
            sortOrder: i,
          },
        });
      }
    }

    if (
      planData.status === PlanStatus.COMPLETED ||
      planData.status === PlanStatus.IN_PROGRESS
    ) {
      const expenseCount = 3 + Math.floor(Math.random() * 4);
      const categories = [
        ExpenseCategory.TRANSPORTATION,
        ExpenseCategory.ACCOMMODATION,
        ExpenseCategory.DINING,
        ExpenseCategory.TICKETS,
        ExpenseCategory.SHOPPING,
        ExpenseCategory.OTHER,
      ];

      for (let i = 0; i < expenseCount; i++) {
        const expenseDate = new Date(startDate);
        expenseDate.setDate(
          expenseDate.getDate() + Math.floor(Math.random() * daysCount),
        );

        await prisma.expense.create({
          data: {
            planId: plan.id,
            amount: Math.floor(Math.random() * 1000) + 100,
            category: categories[Math.floor(Math.random() * categories.length)],
            date: expenseDate,
            notes: `第${i + 1}笔支出`,
          },
        });
      }
    }

    const templateKeys = ["beach", "hiking", "business"] as const;
    const templateKey =
      templateKeys[Math.floor(Math.random() * templateKeys.length)];
    const template = templates[templateKey];

    const packingList = await prisma.packingList.create({
      data: {
        planId: plan.id,
      },
    });

    for (const item of template.slice(0, 4 + Math.floor(Math.random() * 3))) {
      await prisma.packingItem.create({
        data: {
          packingListId: packingList.id,
          name: item.name,
          quantity: item.quantity,
          isPacked: Math.random() > 0.5,
        },
      });
    }
  }

  const favoritePlans = await prisma.plan.findMany({
    where: { isPublic: true },
  });
  for (let i = 0; i < 5; i++) {
    const user = users[i];
    const shuffledPlans = [...favoritePlans].sort(() => 0.5 - Math.random());
    const favoriteCount = 1 + Math.floor(Math.random() * 3);

    for (let j = 0; j < favoriteCount; j++) {
      const plan = shuffledPlans[j];
      if (plan && plan.userId !== user.id) {
        await prisma.favorite.upsert({
          where: {
            userId_planId: { userId: user.id, planId: plan.id },
          },
          update: {},
          create: {
            userId: user.id,
            planId: plan.id,
          },
        });
      }
    }
  }

  console.log("📊 播种完成！");
  console.log("👤 用户: 5");
  console.log("📋 计划: 8");
  console.log("🧳 行程项: 多个");
  console.log("💰 费用记录: 30+");
  console.log("📦 打包清单: 8");
  console.log("❤️ 收藏记录: 多个");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
