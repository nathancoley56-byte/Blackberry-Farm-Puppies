---
layout: page
permalink: /available-puppies.html
title: Available Puppies
heading: Available Puppies
bernedoodles_image: /images/preparing-puppies-category.avif
cavapoos_image: /images/cavapoos-category.avif
---
<nav class="puppy-category-links" aria-label="Puppy categories">
  <div class="puppy-category">
    {% if page.bernedoodles_image and page.bernedoodles_image != "" %}
    <img class="puppy-category__image" src="{{ page.bernedoodles_image | relative_url }}" alt="Bernedoodles">
    {% else %}
    <div class="puppy-category__image puppy-category__image--placeholder" role="img" aria-label="Bernedoodles image placeholder"></div>
    {% endif %}
    <a class="btn" href="/bernedoodles.html">Bernedoodles</a>
  </div>
  <div class="puppy-category">
    {% if page.cavapoos_image and page.cavapoos_image != "" %}
    <img class="puppy-category__image" src="{{ page.cavapoos_image | relative_url }}" alt="Cavapoos">
    {% else %}
    <div class="puppy-category__image puppy-category__image--placeholder" role="img" aria-label="Cavapoos image placeholder"></div>
    {% endif %}
    <a class="btn puppy-category__button--coming-soon" href="/cavapoos.html">Cavapoos<span class="puppy-category__ribbon" aria-hidden="true">Coming<br>Soon</span></a>
  </div>
</nav>
