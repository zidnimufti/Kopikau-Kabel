import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import {Card, CardBody} from "@heroui/react";

export default function AboutHal() {
 
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center">
          <div className="inline-block max-w-lg text-center justify-center py-8">
          <h1 className={title()}>Tentang</h1>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4">
  <div className="flex flex-col md:flex-row gap-6">
    <iframe 
      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1562.910793248694!2d106.0306447406767!3d-5.996782963949835!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e41915e057851f1%3A0xe938748a01a99648!2sKantin%20FT%20Untirta!5e1!3m2!1sid!2sid!4v1746722357824!5m2!1sid!2sid"  
      className="w-full md:w-1/2 h-80 rounded-lg"
      loading="lazy"
    ></iframe>
    
    <Card className="w-full md:w-1/2">
      <CardBody>
        <p className="text-justify">Kopi Kau adalah sebuah merek minuman kopi yang menawarkan berbagai variasi kopi dan minuman lainnya. Kopi Kau adalah salah satu brand dari PT. Karya Improvisasi Milenial, sebuah perusahaan yang bergerak di bidang Integrated F&B Franchise and Management. 
Lebih detailnya, Kopi Kau menawarkan berbagai jenis kopi seperti es kopi susu, es kopi aren, es kopi susu aren, es kopi taro, dan banyak lagi. Mereka juga memiliki menu minuman lainnya seperti es kopi Miss You, es kopi vanilla, dan es kopi matcha. </p>
      </CardBody>
    </Card>
  </div>
</div>
    </DefaultLayout>
  );
}
