export interface ShopItem {
  id: string;
  name: string;
  goldCost: number;
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: "t1", name: "ゲーム15分延長チケット",     goldCost: 30   },
  { id: "t2", name: "選べるご飯チケット",           goldCost: 50   },
  { id: "t3", name: "コンビニでお菓子チケット",     goldCost: 100  },
  { id: "t4", name: "マンガ1冊チケット",            goldCost: 300  },
  { id: "t5", name: "アプリダウンロードチケット",   goldCost: 500  },
  { id: "t6", name: "Switchソフトチケット",         goldCost: 2000 },
];
