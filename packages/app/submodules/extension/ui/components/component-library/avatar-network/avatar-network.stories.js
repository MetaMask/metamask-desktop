import React from 'react';
import {
  COLORS,
  SIZES,
  DISPLAY,
  ALIGN_ITEMS,
  TEXT_COLORS,
  BACKGROUND_COLORS,
  BORDER_COLORS,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box/box';

import README from './README.mdx';
import { AvatarNetwork } from './avatar-network';

export default {
  title: 'Components/ComponentLibrary/AvatarNetwork',
  id: __filename,
  component: AvatarNetwork,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: Object.values(SIZES),
    },
    color: {
      options: Object.values(TEXT_COLORS),
      control: 'select',
    },
    backgroundColor: {
      options: Object.values(BACKGROUND_COLORS),
      control: 'select',
    },
    borderColor: {
      options: Object.values(BORDER_COLORS),
      control: 'select',
    },
    networkName: {
      control: 'text',
    },
    networkImageUrl: {
      control: 'text',
    },
    showHalo: {
      control: 'boolean',
    },
  },
  args: {
    networkName: 'Arbitrum One',
    networkImageUrl: './images/arbitrum.svg',
    size: SIZES.MD,
    showHalo: false,
  },
};

const Template = (args) => {
  return <AvatarNetwork {...args} />;
};
export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const Size = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.BASELINE} gap={1}>
    <AvatarNetwork {...args} size={SIZES.XS} />
    <AvatarNetwork {...args} size={SIZES.SM} />
    <AvatarNetwork {...args} size={SIZES.MD} />
    <AvatarNetwork {...args} size={SIZES.LG} />
    <AvatarNetwork {...args} size={SIZES.XL} />
  </Box>
);

export const NetworkName = Template.bind({});
NetworkName.args = {
  networkImageUrl: '',
};

export const NetworkImageUrl = Template.bind({});

export const ShowHalo = Template.bind({});
ShowHalo.args = {
  showHalo: true,
};

export const ColorBackgroundColorAndBorderColor = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <AvatarNetwork
      {...args}
      backgroundColor={COLORS.GOERLI}
      borderColor={COLORS.GOERLI}
      networkName="G"
      color={COLORS.PRIMARY_INVERSE} // This will have to be added to the BaseAvatar component as a prop so we can change the color of the text and to the base avatar
    />
    <AvatarNetwork
      {...args}
      backgroundColor={COLORS.SEPOLIA}
      borderColor={COLORS.SEPOLIA}
      networkName="G"
      color={COLORS.PRIMARY_INVERSE} // This will have to be added to the BaseAvatar component as a prop so we can change the color of the text and to the base avatar
    />
  </Box>
);
ColorBackgroundColorAndBorderColor.args = {
  networkImageUrl: '',
};
