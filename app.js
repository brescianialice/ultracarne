/* ==========================================================================
   ULTRA CARNE - THE FRAKAS STARK GRID EDITION (JAVASCRIPT LOGIC)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================
  let audioCtx = null;
  let osc1 = null;
  let osc2 = null;
  let filter = null;
  let masterGain = null;
  let audioInitialized = false;

  // Generate all spreads programmatically for all 48 pages
  const zineMockSpreads = [];
  
  // Spread 0: Cover (Single page layout)
  zineMockSpreads.push({
    type: 'single',
    img: 'foto rivista/page_00.jpg'
  });
  
  // Spreads 1 to 23: Pairs of pages (1-2, 3-4, ... 45-46)
  for (let i = 1; i < 47; i += 2) {
    zineMockSpreads.push({
      type: 'double',
      left: `foto rivista/page_${String(i).padStart(2, '0')}.jpg`,
      right: `foto rivista/page_${String(i+1).padStart(2, '0')}.jpg`
    });
  }
  
  // Spread 24: Back Cover (Single page layout)
  zineMockSpreads.push({
    type: 'single',
    img: 'foto rivista/page_47.jpg'
  });

  let currentZineIndex = 0;

  // Horizontal video playlist mix
  const heroVideosList = [
    'VIDEO ORIZZONTALI/net_art_montage.mp4',
    'VIDEO ORIZZONTALI/Untitled(10)_muxed.mov',
    'VIDEO ORIZZONTALI/FINAL_UNCANNY_BLACK.mp4'
  ];
  let currentHeroIdx = 0;

  // ==========================================================================
  // CURTAIN WIPE NAVIGATION SYSTEM
  // ==========================================================================
  const navLinks = document.querySelectorAll('.nav-cell');
  const curtain = document.getElementById('transition-curtain');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId && targetId.startsWith('#')) {
        e.preventDefault();
        
        // Initialize sound on first interaction
        initAudioEngine();
        playBeep(440, 0.05);

        if (curtain) {
          curtain.style.transition = 'top 0.4s cubic-bezier(0.85, 0, 0.15, 1)';
          curtain.style.top = '0%';
          
          setTimeout(() => {
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
              targetSection.scrollIntoView({ behavior: 'auto' });
            }
            
            curtain.style.top = '100%';
            
            setTimeout(() => {
              curtain.style.transition = 'none';
              curtain.style.top = '-100%';
            }, 400);
          }, 450);
        } else {
          document.querySelector(targetId)?.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // ==========================================================================
  // AUDIO SYNTH ENGINE (INVISIBLE & SCROLL-LINKED)
  // ==========================================================================
  function initAudioEngine() {
    if (audioInitialized) return;
    audioInitialized = true;

    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      osc1 = audioCtx.createOscillator();
      osc2 = audioCtx.createOscillator();
      filter = audioCtx.createBiquadFilter();
      masterGain = audioCtx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(55, audioCtx.currentTime); // Deep A1 base note
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(55.2, audioCtx.currentTime); // Detuned spread

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(150, audioCtx.currentTime);
      filter.Q.setValueAtTime(8, audioCtx.currentTime);

      masterGain.gain.setValueAtTime(0, audioCtx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(audioCtx.destination);

      osc1.start();
      osc2.start();

      // Smoothly ramp up the background drone volume
      masterGain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 3.0);
    } catch (e) {
      console.log("Audio API failed to load", e);
    }
  }

  // Pure beep synthesizer for interaction responses
  function playBeep(frequency = 440, duration = 0.1) {
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch(err) {
      // Audio block fallback
    }
  }

  // Cached dimensions to prevent scroll layout thrashing
  let maxScroll = 0;
  function cacheScrollBounds() {
    maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  }
  
  // Cache bounds initially and update on load/resize
  window.addEventListener('load', cacheScrollBounds);
  window.addEventListener('resize', cacheScrollBounds);
  cacheScrollBounds();

  // Throttled Scroll-Linked sound synthesizer sweep using requestAnimationFrame
  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!audioInitialized || !filter) return;
    
    if (!scrollTicking) {
      window.requestAnimationFrame(() => {
        if (maxScroll > 0) {
          const scrollPct = window.scrollY / maxScroll;
          const targetCutoff = 120 + (scrollPct * 480);
          filter.frequency.setTargetAtTime(targetCutoff, audioCtx.currentTime, 0.1);
        }
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  // Start sound on generic first click anywhere
  document.body.addEventListener('click', () => {
    initAudioEngine();
  }, { once: true });

  // ==========================================================================
  // SEAMLESS HERO VIDEOS CROSSFADER DECK
  // ==========================================================================
  const heroVideoDeck = document.getElementById('hero-video-deck');
  
  function crossfadeHeroVideo() {
    const activeVideo = document.getElementById('hero-video-active');
    const hiddenVideo = document.getElementById('hero-video-hidden');
    if (!activeVideo || !hiddenVideo) return;
    
    currentHeroIdx = (currentHeroIdx + 1) % heroVideosList.length;
    const nextSrc = heroVideosList[currentHeroIdx];
    
    // Prepare hidden viewport
    hiddenVideo.src = nextSrc;
    hiddenVideo.load();
    
    hiddenVideo.play().then(() => {
      // Crossfade opacity
      activeVideo.classList.remove('active');
      hiddenVideo.classList.add('active');
      
      // Swap references using IDs
      activeVideo.id = 'hero-video-hidden';
      hiddenVideo.id = 'hero-video-active';
    }).catch(() => {});
  }

  if (heroVideoDeck) {
    heroVideoDeck.addEventListener('click', () => {
      initAudioEngine();
      playBeep(600, 0.08);
      crossfadeHeroVideo();
    });
  }

  // Automatic hero crossfade cycling every 12 seconds
  setInterval(() => {
    crossfadeHeroVideo();
  }, 12000);

  // ==========================================================================
  // FANZINE MANUAL PAGES mockups turner (Dynamic 3D Flip Engine & Mobile Portrait Fallback)
  // ==========================================================================
  const prevBtn = document.getElementById('fanzine-prev');
  const nextBtn = document.getElementById('fanzine-next');
  const bookContainer = document.getElementById('fanzine-book-container');
  
  const leavesCount = 24;
  let currentLeaf = 0; // Desktop active sheet (0 to 24)
  let currentMobilePage = 0; // Mobile active page (0 to 47)
  let isMobile = window.innerWidth <= 768;

  function setupBookDOM() {
    if (!bookContainer) return;
    
    // Preserve spine element, clear any dynamic leaves
    const spine = bookContainer.querySelector('.fanzine-spine');
    bookContainer.innerHTML = '';
    if (spine) {
      bookContainer.appendChild(spine);
    } else {
      const newSpine = document.createElement('div');
      newSpine.className = 'fanzine-spine';
      bookContainer.appendChild(newSpine);
    }
    
    // Create 24 sheets (leaves) dynamically
    for (let i = 0; i < leavesCount; i++) {
      const leaf = document.createElement('div');
      leaf.className = 'book-leaf';
      leaf.id = `leaf-${i}`;
      
      const frontSrc = `foto rivista/page_${String(i * 2).padStart(2, '0')}.jpg`;
      const backSrc = `foto rivista/page_${String(i * 2 + 1).padStart(2, '0')}.jpg`;
      
      leaf.innerHTML = `
        <div class="leaf-side leaf-front">
          <img data-src="${frontSrc}" alt="Page ${i * 2}">
        </div>
        <div class="leaf-side leaf-back">
          <img data-src="${backSrc}" alt="Page ${i * 2 + 1}">
        </div>
      `;
      
      const frontSide = leaf.querySelector('.leaf-front');
      const backSide = leaf.querySelector('.leaf-back');
      
      // Tap interactions directly on left/right half surfaces
      frontSide.addEventListener('click', (e) => {
        if (isMobile) {
          nextPageMobile();
        } else {
          nextSpreadDesktop();
        }
      });
      
      backSide.addEventListener('click', (e) => {
        if (isMobile) {
          prevPageMobile();
        } else {
          prevSpreadDesktop();
        }
      });
      
      bookContainer.appendChild(leaf);
    }
  }

  function lazyLoadBookImages() {
    const range = 2; // Preload current active leaf + 2 sheets forward and backward
    for (let i = 0; i < leavesCount; i++) {
      if (Math.abs(i - currentLeaf) <= range) {
        const leaf = document.getElementById(`leaf-${i}`);
        if (!leaf) continue;
        
        const imgs = leaf.querySelectorAll('img');
        imgs.forEach(img => {
          if (img.dataset.src && !img.src) {
            img.src = img.dataset.src;
          }
        });
      }
    }
  }

  function updateBookState() {
    isMobile = window.innerWidth <= 768;
    
    if (currentLeaf < 0) currentLeaf = 0;
    if (currentLeaf > leavesCount) currentLeaf = leavesCount;
    
    lazyLoadBookImages();
    
    if (!isMobile) {
      // DESKTOP: 3D spread layout
      
      // Toggle parent container shift classes to center single covers
      bookContainer.classList.remove('closed-cover', 'open-spread', 'closed-back');
      if (currentLeaf === 0) {
        bookContainer.classList.add('closed-cover');
      } else if (currentLeaf === leavesCount) {
        bookContainer.classList.add('closed-back');
      } else {
        bookContainer.classList.add('open-spread');
      }
      
      // Style page stacking and rotation angles
      for (let i = 0; i < leavesCount; i++) {
        const leaf = document.getElementById(`leaf-${i}`);
        if (!leaf) continue;
        
        // Clear mobile helper classes
        leaf.classList.remove('active-leaf');
        leaf.querySelector('.leaf-front').classList.remove('mobile-visible', 'mobile-hidden');
        leaf.querySelector('.leaf-back').classList.remove('mobile-visible', 'mobile-hidden');
        
        if (i < currentLeaf) {
          // Leaf flipped to the left side
          leaf.style.transform = 'rotateY(-180deg)';
          leaf.style.zIndex = i;
        } else {
          // Leaf stacked on the right side
          leaf.style.transform = 'rotateY(0deg)';
          leaf.style.zIndex = leavesCount - i;
        }
      }
    } else {
      // MOBILE: Portrait single page layout
      bookContainer.classList.remove('closed-cover', 'open-spread', 'closed-back');
      
      if (currentMobilePage < 0) currentMobilePage = 0;
      if (currentMobilePage > 47) currentMobilePage = 47;
      
      const activeLeafIndex = Math.floor(currentMobilePage / 2);
      const isBackSide = (currentMobilePage % 2 === 1);
      
      // Synchronize lazy loader focus
      currentLeaf = activeLeafIndex;
      lazyLoadBookImages();
      
      for (let i = 0; i < leavesCount; i++) {
        const leaf = document.getElementById(`leaf-${i}`);
        if (!leaf) continue;
        
        leaf.style.transform = '';
        leaf.style.zIndex = '';
        
        if (i === activeLeafIndex) {
          leaf.classList.add('active-leaf');
          
          const frontSide = leaf.querySelector('.leaf-front');
          const backSide = leaf.querySelector('.leaf-back');
          
          if (!isBackSide) {
            frontSide.classList.add('mobile-visible');
            frontSide.classList.remove('mobile-hidden');
            backSide.classList.add('mobile-hidden');
            backSide.classList.remove('mobile-visible');
          } else {
            frontSide.classList.add('mobile-hidden');
            frontSide.classList.remove('mobile-visible');
            backSide.classList.add('mobile-visible');
            backSide.classList.remove('mobile-hidden');
          }
        } else {
          leaf.classList.remove('active-leaf');
        }
      }
    }
  }

  function nextSpreadDesktop() {
    if (currentLeaf < leavesCount) {
      currentLeaf++;
      playBeep(320, 0.08);
      // Synchronize mobile page
      if (currentLeaf === leavesCount) {
        currentMobilePage = 47;
      } else {
        currentMobilePage = currentLeaf * 2 - 1;
      }
      updateBookState();
    }
  }

  function prevSpreadDesktop() {
    if (currentLeaf > 0) {
      currentLeaf--;
      playBeep(320, 0.08);
      // Synchronize mobile page
      if (currentLeaf === 0) {
        currentMobilePage = 0;
      } else {
        currentMobilePage = currentLeaf * 2;
      }
      updateBookState();
    }
  }

  function nextPageMobile() {
    if (currentMobilePage < 47) {
      currentMobilePage++;
      playBeep(320, 0.08);
      // Synchronize desktop leaf
      currentLeaf = Math.floor((currentMobilePage + 1) / 2);
      updateBookState();
    }
  }

  function prevPageMobile() {
    if (currentMobilePage > 0) {
      currentMobilePage--;
      playBeep(320, 0.08);
      // Synchronize desktop leaf
      currentLeaf = Math.floor((currentMobilePage + 1) / 2);
      updateBookState();
    }
  }

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      if (isMobile) {
        prevPageMobile();
      } else {
        prevSpreadDesktop();
      }
    });
    
    nextBtn.addEventListener('click', () => {
      if (isMobile) {
        nextPageMobile();
      } else {
        nextSpreadDesktop();
      }
    });
  }

  // Set up DOM structure & render first cover page
  setupBookDOM();
  updateBookState();

  // Keep desktop/mobile layouts in sync on resizing
  window.addEventListener('resize', () => {
    const wasMobile = isMobile;
    isMobile = window.innerWidth <= 768;
    if (wasMobile !== isMobile) {
      updateBookState();
    }
  });

  // ==========================================================================
  // VIEWPORT-AWARE VIDEO PERFORMANCE OBSERVER (INTERSECTION OBSERVER)
  // ==========================================================================
  function setupVideoPerformanceObserver() {
    const allVideos = document.querySelectorAll('video');
    
    // Pause offscreen loops to free up GPU decoder memory and prevent freezes
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target;
        
        if (entry.isIntersecting) {
          // Play only when visible
          video.play().catch(() => {});
        } else {
          // Pause offscreen videos immediately
          video.pause();
        }
      });
    }, {
      root: null, // Screen viewport
      threshold: 0.05 // Trigger when 5% or more is visible
    });
    
    allVideos.forEach(video => {
      videoObserver.observe(video);
      // Let observer handle autoplay triggers
      video.removeAttribute('autoplay');
    });
  }

  // Delay startup slightly to let initial page render settle
  setTimeout(setupVideoPerformanceObserver, 200);

  // ==========================================================================
  // LIGHTBOX INSPECTOR SYSTEM
  // ==========================================================================
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');

  function openLightbox(src) {
    if (!lightbox || !lightboxImg) return;
    initAudioEngine();
    
    lightboxImg.src = src;
    lightbox.classList.add('open');
    playBeep(880, 0.08);
  }
  window.openLightbox = openLightbox;

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    playBeep(330, 0.06);
  }
  window.closeLightbox = closeLightbox;

  // ==========================================================================
  // MOBILE HAMBURGER MENU DRAWER INTERACTION
  // ==========================================================================
  const navHamburger = document.getElementById('nav-hamburger');
  const navMenu = document.getElementById('nav-menu');
  
  if (navHamburger && navMenu) {
    const navLinks = navMenu.querySelectorAll('.nav-cell');
    
    // Toggle active classes on click
    navHamburger.addEventListener('click', () => {
      initAudioEngine();
      playBeep(440, 0.05);
      
      navHamburger.classList.toggle('active');
      navMenu.classList.toggle('open');
    });
    
    // Auto-close menu when clicking any link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navHamburger.classList.remove('active');
        navMenu.classList.remove('open');
      });
    });
  }

  // ==========================================================================
  // DIRECT PAYPAL INTEGRATION
  // ==========================================================================
  const btnAcquista = document.getElementById('btn-acquista');
  const btnRequest = document.getElementById('btn-request');

  const PAYPAL_CONFIG = {
    paypalMeLink: 'https://paypal.me/brescianialice02/10'
  };

  function handlePurchase() {
    initAudioEngine();
    playBeep(600, 0.12);
    
    // Open secure PayPal.Me 10€ checkout in a new window/tab
    window.open(PAYPAL_CONFIG.paypalMeLink, '_blank');
  }

  if (btnAcquista) btnAcquista.addEventListener('click', handlePurchase);
  if (btnRequest) btnRequest.addEventListener('click', handlePurchase);

});
