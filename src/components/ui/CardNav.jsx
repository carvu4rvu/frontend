import { useState, useRef } from 'react';
// use your own icon import if react-icons is not available
import { GoArrowUpRight } from 'react-icons/go';
import { Link } from 'react-router-dom';
import './CardNav.css';

const CardNav = ({
  logo,
  logoAlt = 'Logo',
  items,
  className = '',
  isOpen: isOpenProp,
  onOpenChange,
  // Deprecated props kept for compatibility
  ease,
  baseColor,
  menuColor,
  buttonBgColor,
  buttonTextColor,
  onMenuOpen,
  onMenuClose
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef(null);

  const navItemsList = Array.isArray(items) ? items : items?.items || [];
  const hasNavItems = navItemsList.length > 0;

  // Use controlled isOpen when provided (e.g. from AdminLayout), else internal state
  const isOpen = isOpenProp !== undefined ? isOpenProp : isExpanded;

  const openMenu = () => {
    if (!hasNavItems) return;
    setIsHamburgerOpen(true);
    setIsExpanded(true);
    onMenuOpen?.();
  };
  
  const closeMenu = () => {
    setIsHamburgerOpen(false);
    setIsExpanded(false);
    onMenuClose?.();
  };

  const toggleMenu = () => {
    if (!hasNavItems) return;
    if (isOpenProp !== undefined && onOpenChange) {
      onOpenChange(!isOpen);
    } else if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  return (
    <div className={`card-nav-container ${className}`}>
      <nav 
        ref={navRef} 
        className={`card-nav ${isOpen && hasNavItems ? 'open' : ''}`} 
        onMouseEnter={isOpenProp === undefined ? openMenu : undefined}
        onMouseLeave={isOpenProp === undefined ? closeMenu : undefined}
      >
        <div className="card-nav-top">
          <div className="logo-container">
            {typeof logo === 'string' ? (
                <img src={logo} alt={logoAlt} className="logo" />
            ) : (
                logo
            )}
          </div>

          <div className="card-nav-spacer" />

          <div className="card-nav-search-container">
             {items?.searchComponent}
          </div>
          
          <div className="card-nav-right-actions">
              {items?.rightActions}
          </div>

          {hasNavItems && (
            <div
              className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''}`}
              onClick={toggleMenu}
              role="button"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              tabIndex={0}
              style={{ color: '#fff' }}
            >
              <div className="hamburger-line" />
              <div className="hamburger-line" />
            </div>
          )}
        </div>

        {isOpen && hasNavItems && (
        <div className="card-nav-content" aria-hidden={false}>
            {navItemsList.map((item, idx) => (
              <div
                key={`${item.label}-${idx}`}
                className="nav-card"
                style={{ backgroundColor: item.bgColor, color: item.textColor }}
              >
                <div className="nav-card-label">{item.label}</div>
                <div className="nav-card-links">
                  {item.links?.map((lnk, i) => (
                    lnk.path ? (
                      <Link key={`${lnk.label}-${i}`} className="nav-card-link" to={lnk.path} aria-label={lnk.ariaLabel} onClick={() => {
                          // Optional: Close menu on click
                      }}>
                        <GoArrowUpRight className="nav-card-link-icon" aria-hidden="true" />
                        <span className="nav-link-text">{lnk.label}</span>
                      </Link>
                    ) : (
                      <a key={`${lnk.label}-${i}`} className="nav-card-link" href={lnk.href} aria-label={lnk.ariaLabel}>
                        <GoArrowUpRight className="nav-card-link-icon" aria-hidden="true" />
                        <span className="nav-link-text">{lnk.label}</span>
                      </a>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </nav>
    </div>
  );
};

export default CardNav;
