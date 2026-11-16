(() => {
    const labels = {
            viewer: "Photo viewer",
            enlarge: "View a larger photo of",
            close: "Close photo",
            fullscreen: "Enter fullscreen",
            exitFullscreen: "Exit fullscreen",
            previous: "Previous photo",
            next: "Next photo",
            fullscreenError: "Could not enter fullscreen.",
            expandedMode: "Showing the expanded photo view."
    };

    const createButton = (className, text, label) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = className;
        button.textContent = text;
        button.setAttribute("aria-label", label);
        button.title = label;
        return button;
    };

    const dialog = document.createElement("dialog");
    dialog.className = "image-viewer";
    dialog.setAttribute("aria-label", labels.viewer);

    const surface = document.createElement("div");
    surface.className = "image-viewer__surface";

    const image = document.createElement("img");
    image.className = "image-viewer__image";

    const caption = document.createElement("figcaption");
    caption.className = "image-viewer__caption";

    const status = document.createElement("p");
    status.className = "image-viewer__status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    const figure = document.createElement("figure");
    figure.className = "image-viewer__figure";
    figure.append(image, status, caption);

    const closeButton = createButton("image-viewer__close", "×", labels.close);
    const fullscreenButton = createButton("image-viewer__fullscreen", "⛶", labels.fullscreen);
    const previousButton = createButton("image-viewer__nav image-viewer__nav--previous", "‹", labels.previous);
    const nextButton = createButton("image-viewer__nav image-viewer__nav--next", "›", labels.next);

    surface.append(closeButton, fullscreenButton, previousButton, figure, nextButton);
    dialog.append(surface);
    document.body.append(dialog);

    let activePhotos = [];
    let activeIndex = 0;
    let sourceImage = null;
    let customFullscreen = false;
    let showPhotoCount = false;

    const updateFullscreenButton = () => {
        const isFullscreen = document.fullscreenElement === surface || customFullscreen;
        const label = isFullscreen ? labels.exitFullscreen : labels.fullscreen;
        fullscreenButton.setAttribute("aria-label", label);
        fullscreenButton.title = label;
        fullscreenButton.setAttribute("aria-pressed", String(isFullscreen));
    };

    const renderPhoto = () => {
        const currentPhoto = activePhotos[activeIndex];
        if (!currentPhoto) return;

        image.src = currentPhoto.currentSrc || currentPhoto.src;
        image.alt = currentPhoto.alt;
        caption.textContent = currentPhoto.alt;
        caption.hidden = !currentPhoto.alt;

        const hasGalleryNavigation = activePhotos.length > 1;
        previousButton.hidden = !hasGalleryNavigation;
        nextButton.hidden = !hasGalleryNavigation;
        previousButton.disabled = activeIndex === 0;
        nextButton.disabled = activeIndex === activePhotos.length - 1;
        status.textContent = hasGalleryNavigation && showPhotoCount
            ? `${activeIndex + 1} / ${activePhotos.length}`
            : "";
        status.hidden = !hasGalleryNavigation || !showPhotoCount;
    };

    const closeViewer = async () => {
        if (document.fullscreenElement === surface) {
            try {
                await document.exitFullscreen();
            } catch (error) {
                console.error("Could not exit fullscreen.", error);
            }
        }
        dialog.close();
        dialog.classList.remove("image-viewer--expanded");
        customFullscreen = false;
        updateFullscreenButton();
        sourceImage?.focus({ preventScroll: true });
    };

    const openViewer = (selectedImage) => {
        sourceImage = selectedImage;
        const gallery = selectedImage.closest(".puppy-gallery, .former-puppies-gallery");
        showPhotoCount = Boolean(gallery && gallery.classList.contains("puppy-gallery"));
        activePhotos = gallery
            ? [...gallery.querySelectorAll(".puppy-gallery__item img, .former-puppies-gallery__image")]
            : [selectedImage];
        activeIndex = activePhotos.indexOf(selectedImage);
        if (activeIndex < 0) {
            activePhotos = [selectedImage];
            activeIndex = 0;
        }

        status.textContent = "";
        renderPhoto();
        dialog.showModal();
        closeButton.focus();
    };

    const navigate = (direction) => {
        const nextIndex = activeIndex + direction;
        if (nextIndex < 0 || nextIndex >= activePhotos.length) return;

        activeIndex = nextIndex;
        renderPhoto();
        activePhotos[activeIndex].closest(".puppy-gallery__item")
            ?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    };

    document.querySelectorAll("main img").forEach((photo) => {
        photo.tabIndex = 0;
        photo.setAttribute("role", "button");
        photo.setAttribute("aria-haspopup", "dialog");
        photo.setAttribute("aria-label", `${labels.enlarge} ${photo.alt || labels.viewer}`);
        photo.classList.add("image-viewer__trigger");
    });

    document.addEventListener("click", (event) => {
        const photo = event.target.closest("main img.image-viewer__trigger");
        if (photo) openViewer(photo);
    });

    document.addEventListener("keydown", (event) => {
        const photo = event.target.closest?.("main img.image-viewer__trigger");
        if (photo && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            openViewer(photo);
            return;
        }

        if (!dialog.open) return;
        if (event.key === "Escape") {
            event.preventDefault();
            closeViewer();
        } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            navigate(-1);
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            navigate(1);
        }
    });

    closeButton.addEventListener("click", closeViewer);
    previousButton.addEventListener("click", () => navigate(-1));
    nextButton.addEventListener("click", () => navigate(1));

    fullscreenButton.addEventListener("click", async () => {
        status.textContent = "";
        if (document.fullscreenElement === surface) {
            await document.exitFullscreen();
        } else if (customFullscreen) {
            customFullscreen = false;
            dialog.classList.remove("image-viewer--expanded");
        } else if (document.fullscreenEnabled && surface.requestFullscreen) {
            try {
                await surface.requestFullscreen();
            } catch (error) {
                console.error("Could not enter fullscreen.", error);
                status.textContent = labels.expandedMode;
                status.hidden = false;
                customFullscreen = true;
                dialog.classList.add("image-viewer--expanded");
            }
        } else {
            customFullscreen = true;
            dialog.classList.add("image-viewer--expanded");
        }
        updateFullscreenButton();
    });

    dialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        closeViewer();
    });

    dialog.addEventListener("click", (event) => {
        if (event.target === dialog) closeViewer();
    });

    document.addEventListener("fullscreenchange", updateFullscreenButton);
})();
