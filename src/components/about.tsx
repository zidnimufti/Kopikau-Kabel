import { title } from "@/components/primitives";
import { Card, CardBody, CardFooter, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { About } from "@/data/about";

interface AboutPageProps {
  abouts: About[];
}

export const AboutPage: React.FC<AboutPageProps> = ({ abouts }) => {
  return (
      <section className="flex flex-col items-center justify-center">
        <div className="inline-block max-w-lg text-center justify-center py-8">
          <h1 className={title()}>About</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {abouts.map((about) => (
            <Card 
              key={about.id} 
              className="border border-default-200"
              isHoverable
              isPressable
            >
              <CardBody className="p-0 overflow-hidden">
                <div className="relative">
                  <img
                    src={about.images}
                    alt={about.name}
                    className="w-full h-64 object-cover"
                  />
                </div>
              </CardBody>
              <CardFooter className="flex flex-col items-start gap-2 p-4">
                <div className="flex items-center gap-1">
                  <div className="flex">
                    <Icon icon="lucide:user" />
                  </div>
                </div>
                <h3 className="font-semibold text-md">{about.name}</h3>
                <p className="text-xs text-default-500 line-clamp-2">{about.job}</p>
                {about.linkedin && (
                  <Button 
                    size="sm" 
                    color="primary"
                    variant="flat"
                    endContent={<Icon icon="lucide:external-link" />}
                    onClick={() => window.open(about.linkedin, "_blank")}
                  >
                    Instagram
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
  );
}
