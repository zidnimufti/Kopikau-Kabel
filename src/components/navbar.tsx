import { Link } from "@heroui/link";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@heroui/navbar";
import { link as linkStyles } from "@heroui/theme";
import clsx from "clsx";
import { CartDropdown } from "./CartDropdown";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";

import { GiCoffeeCup } from "react-icons/gi";

export const Navbar = () => {
  

  return (
    <HeroUINavbar maxWidth="xl" position="sticky" >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="gap-3 max-w-fit">
          <Link
            className="flex justify-start items-center gap-1"
            color="foreground"
            href="/"
          >
            <GiCoffeeCup size={22}/>
            <p className="font-bold text-inherit">Kopikau Kabel</p>
          </Link>
        </NavbarBrand>
        <div className="hidden lg:flex gap-4 justify-start ml-2">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <Link
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-primary data-[active=true]:font-medium"
                )}
                color="foreground"
                href={item.href}
              >
                {item.label}
              </Link>
            </NavbarItem>
          ))}
        </div>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex gap-2">
          <ThemeSwitch />
          <CartDropdown />
        </NavbarItem>
        <NavbarItem className="hidden md:flex">
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <ThemeSwitch />
        <CartDropdown />
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {siteConfig.navMenuItems.map((item, index) => {
        const isActive = typeof window !== "undefined" && window.location.pathname === item.href;
        return (
          <NavbarMenuItem key={`${item}-${index}`}>
            <Link
          className={clsx(
            isActive ? "text-primary" : "text-gray-500",
            "transition-colors"
          )}
          href={item.href}
          size="lg"
            >
          {item.label}
            </Link>
          </NavbarMenuItem>
        );
          })}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
