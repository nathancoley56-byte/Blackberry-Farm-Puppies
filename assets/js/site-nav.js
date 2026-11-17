(() => {
    const header = document.querySelector("body > header");
    const updateHeaderHeight = () => {
        const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        document.documentElement.style.setProperty("--site-header-height", `${header.offsetHeight / rootSize}rem`);
    };

    updateHeaderHeight();
    if ("ResizeObserver" in window) {
        new ResizeObserver(updateHeaderHeight).observe(header);
    } else {
        window.addEventListener("resize", updateHeaderHeight);
    }

    let lastScrollY = Math.max(0, window.scrollY);
    header.classList.add("site-header--scrolling");

    window.addEventListener("scroll", () => {
        const scrollY = Math.max(0, window.scrollY);
        if (scrollY <= header.offsetHeight) {
            header.classList.remove("site-header--hidden");
            lastScrollY = scrollY;
        } else if (Math.abs(scrollY - lastScrollY) >= 4) {
            header.classList.toggle("site-header--hidden", scrollY > lastScrollY);
            lastScrollY = scrollY;
        }
    }, { passive: true });
})();
