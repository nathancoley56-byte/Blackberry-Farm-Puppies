(() => {
  const updatePhotoLists = () => {
    document.querySelectorAll('[aria-label="list field"] label[for^="photos-field-"], [aria-label="list field"] label[for^="former_puppy_photos-field-"], [aria-label="list field"] label[for^="testimonials-field-"]').forEach((label) => {
      if (!/^(Photo Wheel Images|Former Puppy Photos|Testimonials)(?:\s*\(optional\))?$/.test(label.textContent.trim())) return;

      const field = label.closest('[aria-label="list field"]');
      const list = document.getElementById(label.htmlFor);
      if (!list || list.parentElement !== field) return;

      const topBar = list.firstElementChild;
      const addButton = topBar && Array.from(topBar.children).find((child) => child.tagName === "BUTTON");
      let bottomBar = field.querySelector(":scope > .photo-wheel-add-bottom");

      if (!addButton) {
        if (bottomBar) bottomBar.remove();
        return;
      }

      if (!bottomBar) {
        bottomBar = document.createElement("div");
        bottomBar.className = "photo-wheel-add-bottom";
        bottomBar.style.cssText = "display:flex;justify-content:flex-end;margin-top:0.5rem";
        bottomBar.addEventListener("click", (event) => {
          if (!event.target.closest("button")) return;
          const currentList = bottomBar.previousElementSibling;
          const currentTopBar = currentList && currentList.firstElementChild;
          const currentAddButton = currentTopBar && Array.from(currentTopBar.children).find((child) => child.tagName === "BUTTON");
          if (currentAddButton && !currentAddButton.disabled) currentAddButton.click();
        });
        list.insertAdjacentElement("afterend", bottomBar);
      }

      if (bottomBar.previousElementSibling !== list) list.insertAdjacentElement("afterend", bottomBar);

      const bottomButton = bottomBar.firstElementChild;
      if (!bottomButton || bottomButton.outerHTML !== addButton.outerHTML) {
        bottomBar.replaceChildren(addButton.cloneNode(true));
      }
    });
  };

  let scheduled = false;
  const scheduleUpdate = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      updatePhotoLists();
    });
  };

  new MutationObserver(scheduleUpdate).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["disabled"],
  });
  scheduleUpdate();
})();
