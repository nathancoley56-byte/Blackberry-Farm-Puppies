---
layout: page
permalink: /contact.html
title: Contact
heading: Contact Us
---
{% include contact-form.html heading="Contact Us" is_page=true %}

<section class="contact-social">
  <h2>Find us on social media</h2>
  <div class="contact-social__links">
  <a class="contact-social__instagram" href="https://www.instagram.com/blackberryfarmpuppies?vrfl=MjkxMGNwYjhjazFw" target="_blank" rel="noopener noreferrer" aria-label="Visit Blackberry Farm Puppies on Instagram">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5"></rect>
      <circle cx="12" cy="12" r="4"></circle>
      <circle class="contact-social__instagram-dot" cx="17.5" cy="6.5" r="1"></circle>
    </svg>
  </a>
  {% include facebook-link.html class="contact-social__facebook" %}
  </div>
</section>