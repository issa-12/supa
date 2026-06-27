### Privacy-Aware Social Graph and Presence System — MAJOR

**Why we chose this module:**  
ReadTrack is a social reading platform, so relationships, privacy, and live presence are core to the experience. Instead of treating social features as a small add-on, we built a full privacy-aware social graph that controls how users connect, interact, and discover one another.

**What it has:**  
- Friend requests with accept, reject, cancel, and block flows.
- Private profile visibility rules.
- Report functionality for unsafe or abusive users/content.
- Live online/offline presence display.
- Relationship-aware profile and feed visibility.
- Social discovery that respects privacy settings.

**What technical challenges it addresses:**  
This module handles friendship state transitions, private profile visibility, blocking and reporting, and online/offline presence updates. It also ensures that profile and activity data are shown only to the appropriate audience, while still keeping the app searchable and socially useful.

**How it adds value to the project:**  
It makes the platform feel like a real social network rather than a simple book tracker. Users can manage trust, control who sees their content, and stay aware of who is active in the community.

**Why it is a Major module:**  
- It is central to the social behavior of the app, not a cosmetic extra.
- It combines multiple systems: database relations, permissions, UI state, and live updates.
- It affects both privacy and interaction across the whole platform.
- It requires coordinated frontend and backend logic to work correctly.
- It provides meaningful product value and changes how the app is used.

**Why it deserves Major module status:**  
This module is structurally important to the application and involves coordinated frontend and backend logic, privacy rules, relationship management, and real-time user state. It is substantial, relevant to the project, and technically complex enough to merit Major status.

---

### Book-Centric Community Platform with AI Moderation and Hashtag Discovery — MAJOR

**Why we chose this module:**  
ReadTrack is not just a book tracker; it is also a community space for book-focused discussion. We built a book-centric social feed so users can share thoughts tied to specific books, discover what is trending, and interact through likes and comments in a privacy-aware way.

**What it has:**  
- Posts tied to a specific book.
- Hashtag support with trending tag discovery.
- Separate Friends and Trending feeds with different ranking logic.
- Likes on posts and comments.
- Privacy-aware filtering for private accounts.

**What technical challenges it addresses:**  
This module combines content creation, discovery, ranking, and privacy-aware presentation. It also enforces privacy at the data layer so users only see the content they are allowed to see, while still keeping the feed useful and dynamic.

**How it adds value to the project:**  
It turns ReadTrack into a real community around books rather than a simple personal library app. Users can discuss books, discover trending topics, and participate in a structured social feed that stays connected to the reading experience.

**Why it is a Major module:**  
- It is a core feature of the app, not a decorative add-on.
- It combines book linkage, discovery, moderation, filtering, and user interaction.
- It depends on multiple coordinated backend and frontend systems.
- It adds meaningful product value and shapes how the app is used.
- It demonstrates real technical complexity and design judgment.
