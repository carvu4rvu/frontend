import React from 'react';
import { Button, Icon, IconButton, Tooltip } from '@chakra-ui/react';
import { ViewIcon } from '@chakra-ui/icons';
import { FaHeart, FaRegHeart, FaBookmark, FaRegBookmark } from 'react-icons/fa';
import { getProjectCoverImage } from '../../utils/projectSnaps';
import ProgressiveImage from './ProgressiveImage';
import './TopChartsList.css';

function formatCount(n) {
  if (n == null) return '0';
  const num = Number(n);
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

function PreviewHead({ project, rank, onOpenProjectImages }) {
  const preview = getProjectCoverImage(project);
  const rankClass = `top-charts-preview-card__rank${rank <= 3 ? ' top-charts-preview-card__rank--top3' : ''}`;
  return (
    <div className="top-charts-preview-card__head">
      <span className={rankClass}>{rank}</span>
      <div
        className="top-charts-preview-card__thumb"
        role={preview && onOpenProjectImages ? 'button' : undefined}
        tabIndex={preview && onOpenProjectImages ? 0 : undefined}
        style={preview && onOpenProjectImages ? { cursor: 'zoom-in' } : undefined}
        onClick={preview && onOpenProjectImages ? (e) => { e.stopPropagation(); onOpenProjectImages(project, preview); } : undefined}
        onKeyDown={preview && onOpenProjectImages ? (e) => { if (e.key === 'Enter') { e.stopPropagation(); onOpenProjectImages(project, preview); } } : undefined}
      >
        {preview ? (
          <ProgressiveImage src={preview} project={project} profile="icon" priority={2} as="native" alt="" w="100%" h="100%" />
        ) : null}
      </div>
      <div className="top-charts-preview-card__meta">
        <div className="top-charts-preview-card__title">{project.title || 'Untitled'}</div>
        <div className="top-charts-preview-card__sub">
          {project.usn} • {project.genre || project.category || '—'}
        </div>
        <div className="top-charts-preview-card__likes">{formatCount(project.likes_count)} likes</div>
      </div>
    </div>
  );
}

export default function TopChartsList({
  projects = [],
  mode = 'preview',
  onViewProject,
  onOpenProjectImages,
  onLike,
  onFavorite,
  likingId,
  favoritingId,
}) {
  if (!projects.length) return null;

  if (mode === 'preview') {
    return (
      <div className="top-charts-preview-grid">
        {projects.map((p, i) => (
          <article
            key={p.id}
            className="top-charts-preview-card"
            onClick={() => onViewProject?.(p)}
            onKeyDown={(e) => e.key === 'Enter' && onViewProject?.(p)}
            role="button"
            tabIndex={0}
          >
            <PreviewHead project={p} rank={i + 1} onOpenProjectImages={onOpenProjectImages} />
            <span
              className="top-charts-preview-card__cta"
              onClick={(e) => {
                e.stopPropagation();
                onViewProject?.(p, e);
              }}
              role="presentation"
            >
              View details
            </span>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="top-charts-full-list">
      {projects.map((p, i) => {
        const rank = i + 1;
        const preview = getProjectCoverImage(p);
        const rankClass = `top-charts-full-row__rank${rank <= 3 ? ' top-charts-full-row__rank--top3' : ''}`;
        return (
          <article
            key={p.id}
            className="top-charts-full-row"
            onClick={() => onViewProject?.(p)}
            onKeyDown={(e) => e.key === 'Enter' && onViewProject?.(p)}
            role="button"
            tabIndex={0}
          >
            <span className={rankClass}>{rank}</span>
            <div
              className="top-charts-full-row__thumb"
              role={preview && onOpenProjectImages ? 'button' : undefined}
              tabIndex={preview && onOpenProjectImages ? 0 : undefined}
              style={preview && onOpenProjectImages ? { cursor: 'zoom-in' } : undefined}
              onClick={preview && onOpenProjectImages ? (e) => { e.stopPropagation(); onOpenProjectImages(p, preview); } : undefined}
              onKeyDown={preview && onOpenProjectImages ? (e) => { if (e.key === 'Enter') { e.stopPropagation(); onOpenProjectImages(p, preview); } } : undefined}
            >
              {preview ? (
                <ProgressiveImage src={preview} project={p} profile="icon" priority={2} as="native" alt="" w="100%" h="100%" />
              ) : null}
            </div>
            <div className="top-charts-full-row__body">
              <div className="top-charts-full-row__title">{p.title || 'Untitled'}</div>
              <div className="top-charts-full-row__sub">
                {p.usn} • {p.genre || p.category || '—'}
              </div>
              <div className="top-charts-full-row__stats">
                <span>{formatCount(p.likes_count)} likes</span>
                <span>{formatCount(p.views_count)} views</span>
                <span>{formatCount(p.favorites_count)} favorites</span>
              </div>
            </div>
            <div className="top-charts-full-row__actions">
              <Button
                size="sm"
                variant="outline"
                leftIcon={<ViewIcon />}
                borderColor="blue.200"
                color="blue.600"
                _hover={{ bg: 'blue.50' }}
                onClick={(e) => onViewProject?.(p, e)}
              >
                Full details
              </Button>
              <Tooltip label={p.is_liked ? 'Unlike' : 'Like'}>
                <IconButton
                  icon={<Icon as={p.is_liked ? FaHeart : FaRegHeart} />}
                  size="sm"
                  variant="ghost"
                  color={p.is_liked ? 'red.500' : 'gray.500'}
                  aria-label="Like"
                  onClick={(e) => onLike?.(p.id, e)}
                  isLoading={likingId === p.id}
                />
              </Tooltip>
              <Tooltip label={p.is_favorited ? 'Remove favorite' : 'Favorite'}>
                <IconButton
                  icon={<Icon as={p.is_favorited ? FaBookmark : FaRegBookmark} />}
                  size="sm"
                  variant="ghost"
                  color={p.is_favorited ? 'orange.500' : 'gray.500'}
                  aria-label="Favorite"
                  onClick={(e) => onFavorite?.(p.id, e)}
                  isLoading={favoritingId === p.id}
                />
              </Tooltip>
            </div>
            <div className="top-charts-full-row__actions-mobile">
              <Button size="xs" variant="outline" colorScheme="blue" onClick={(e) => onViewProject?.(p, e)}>
                Details
              </Button>
              <IconButton
                icon={<Icon as={p.is_liked ? FaHeart : FaRegHeart} />}
                size="sm"
                variant="ghost"
                aria-label="Like"
                onClick={(e) => onLike?.(p.id, e)}
                isLoading={likingId === p.id}
              />
              <IconButton
                icon={<Icon as={p.is_favorited ? FaBookmark : FaRegBookmark} />}
                size="sm"
                variant="ghost"
                aria-label="Favorite"
                onClick={(e) => onFavorite?.(p.id, e)}
                isLoading={favoritingId === p.id}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
