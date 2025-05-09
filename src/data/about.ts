export interface About {
    id: number;
    name: string;
    job: string;
    linkedin: string;
    images: string;
  }
  
  export const abouts: About[] = [
    {
      id: 1,
      name: "Fany Prayoga",
      job: "Frontend Developer",
      linkedin: "https://www.instagram.com/ynaf_corpse/",
      images: "./img/kripca.png"
    },
    {
      id: 2,
      name: "Yudi Pratama",
      job: "Backend Engineer",
      linkedin: "https://www.linkedin.com/in/janesmith",
      images: "./img/kripca.png"
    },
    {
      id: 3,
      name: "Widla Muhammad Zidni Mufti",
      job: "Full stack Developer",
      linkedin: "https://facebook.com/widla.zidni",
      images: "https://www.facebook.com/photo/?fbid=4203760643183804&set=a.1417146451845251"
    }
  ];